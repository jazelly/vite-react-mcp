import { target } from '../../shared/const.js';
import { DEFAULT_TOOLKIT_ICON_DATA_URL } from '../../shared/default_toolkit_icon.js';
import {
  buildSelectionContextSummary,
  buildSelectionSourcePreview,
} from '../../shared/selection_context_format.js';
import {
  buildBrowserSourceCandidates,
  isAllowedProjectSourcePath,
  normalizeSourceRoot,
} from '../../shared/source_path.js';
import type {
  SelectionContext,
  ToolkitConfig,
  ToolkitPosition,
} from '../../shared/types.js';
import { buildSelectionContextForElement } from './selection_context.js';
import {
  clearSelectableElementCache,
  getSelectableElementAtPosition,
} from './selection_dom.js';

interface ToolkitRuntimeOptions {
  initialConfig?: ToolkitConfig;
}

interface ToolkitRuntimeResult {
  showToolkit: () => void;
  hideToolkit: () => void;
  setToolkitConfig: (config: Partial<ToolkitConfig>) => ToolkitConfig;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  setSelectionMode: (enabled: boolean) => void;
  getLastSelectionContext: () => SelectionContext | null;
  copyLastSelectionContext: (format?: 'text' | 'json') => Promise<{
    success: boolean;
    copied: boolean;
    format: 'text' | 'json';
    context?: SelectionContext;
    error?: string;
  }>;
}

const DEFAULT_TOOLKIT_CONFIG: Required<Omit<ToolkitConfig, 'iconUrl'>> & {
  iconUrl: string | null;
} = {
  enabled: true,
  defaultVisible: true,
  defaultExpanded: false,
  position: 'bottom-right',
  offset: {
    x: 20,
    y: 20,
  },
  accentColor: '#111827',
  zIndex: 2147483000,
  iconUrl: DEFAULT_TOOLKIT_ICON_DATA_URL,
};

const DEFAULT_SNIPPET_CONTEXT_LINES = 8;
const DEFAULT_MAX_SNIPPET_FILES = 3;
const LAUNCHER_SIZE = 58;
const SELECTION_CONFIRMATION_MS = 1100;
const SELECTION_STYLE_ID = 'agentic-react-selection-styles';
const CONTRAST_LIGHT = 'rgba(255, 255, 255, 0.98)';
const CONTRAST_DARK = 'rgba(15, 23, 42, 0.98)';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const mergeToolkitConfig = (
  config: ToolkitConfig | undefined,
  nextConfig: Partial<ToolkitConfig> | undefined,
): Required<Omit<ToolkitConfig, 'iconUrl'>> & { iconUrl: string | null } => {
  const baseConfig = {
    ...DEFAULT_TOOLKIT_CONFIG,
    ...(config || {}),
    iconUrl:
      config?.iconUrl !== undefined
        ? config.iconUrl
        : DEFAULT_TOOLKIT_CONFIG.iconUrl,
  };

  if (!nextConfig) {
    return {
      ...baseConfig,
      offset: {
        ...DEFAULT_TOOLKIT_CONFIG.offset,
        ...(baseConfig.offset || {}),
      },
    };
  }

  return {
    ...baseConfig,
    ...nextConfig,
    iconUrl:
      nextConfig.iconUrl !== undefined
        ? nextConfig.iconUrl
        : baseConfig.iconUrl,
    offset: {
      ...DEFAULT_TOOLKIT_CONFIG.offset,
      ...(baseConfig.offset || {}),
      ...(nextConfig.offset || {}),
    },
  };
};

const setPosition = (
  element: HTMLElement,
  position: ToolkitPosition,
  xOffset: number,
  yOffset: number,
) => {
  element.style.top = '';
  element.style.right = '';
  element.style.bottom = '';
  element.style.left = '';

  if (position === 'top-left') {
    element.style.top = `${yOffset}px`;
    element.style.left = `${xOffset}px`;
    return;
  }

  if (position === 'top-right') {
    element.style.top = `${yOffset}px`;
    element.style.right = `${xOffset}px`;
    return;
  }

  if (position === 'bottom-left') {
    element.style.bottom = `${yOffset}px`;
    element.style.left = `${xOffset}px`;
    return;
  }

  element.style.bottom = `${yOffset}px`;
  element.style.right = `${xOffset}px`;
};

const parseCssColor = (color: string): RgbaColor | null => {
  const normalizedColor = color.trim().toLowerCase();
  if (
    !normalizedColor ||
    normalizedColor === 'transparent' ||
    normalizedColor === 'currentcolor'
  ) {
    return null;
  }

  const colorMatch = normalizedColor.match(/^rgba?\((.+)\)$/);
  if (!colorMatch) {
    return null;
  }

  const colorParts = colorMatch[1]
    .replace(/\s*\/\s*/, ' ')
    .split(/[,\s]+/)
    .filter(Boolean);

  if (colorParts.length < 3) {
    return null;
  }

  const parseChannel = (channel: string): number | null => {
    if (channel.endsWith('%')) {
      const percentValue = Number.parseFloat(channel);
      return Number.isFinite(percentValue)
        ? Math.round((Math.max(0, Math.min(100, percentValue)) / 100) * 255)
        : null;
    }

    const value = Number.parseFloat(channel);
    return Number.isFinite(value) ? Math.max(0, Math.min(255, value)) : null;
  };

  const parseAlpha = (alpha: string | undefined): number => {
    if (!alpha) return 1;

    if (alpha.endsWith('%')) {
      const percentValue = Number.parseFloat(alpha);
      return Number.isFinite(percentValue)
        ? Math.max(0, Math.min(1, percentValue / 100))
        : 1;
    }

    const value = Number.parseFloat(alpha);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
  };

  const r = parseChannel(colorParts[0]);
  const g = parseChannel(colorParts[1]);
  const b = parseChannel(colorParts[2]);

  if (r === null || g === null || b === null) {
    return null;
  }

  return {
    r,
    g,
    b,
    a: parseAlpha(colorParts[3]),
  };
};

const getRelativeLuminance = ({ r, g, b }: RgbaColor): number => {
  const toLinearChannel = (channel: number): number => {
    const normalizedChannel = channel / 255;
    return normalizedChannel <= 0.03928
      ? normalizedChannel / 12.92
      : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * toLinearChannel(r) +
    0.7152 * toLinearChannel(g) +
    0.0722 * toLinearChannel(b)
  );
};

const getEffectiveBackgroundColor = (element: Element): RgbaColor | null => {
  let currentElement: Element | null = element;

  while (currentElement) {
    const computedStyle = window.getComputedStyle(currentElement);
    const backgroundColor = parseCssColor(computedStyle.backgroundColor);
    if (backgroundColor && backgroundColor.a > 0.05) {
      return backgroundColor;
    }

    currentElement = currentElement.parentElement;
  }

  return parseCssColor(window.getComputedStyle(document.body).backgroundColor);
};

const applyHoverContrastForElement = (
  hoverElement: HTMLElement,
  element: Element,
) => {
  const backgroundColor = getEffectiveBackgroundColor(element);
  const isDarkSurface = backgroundColor
    ? getRelativeLuminance(backgroundColor) < 0.46
    : false;

  hoverElement.style.setProperty(
    '--agentic-react-hover-inner',
    isDarkSurface ? CONTRAST_LIGHT : CONTRAST_DARK,
  );
  hoverElement.style.setProperty(
    '--agentic-react-hover-outer',
    isDarkSurface ? CONTRAST_DARK : CONTRAST_LIGHT,
  );
  hoverElement.style.setProperty(
    '--agentic-react-hover-fill',
    isDarkSurface ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)',
  );
};

const toTextContext = (selectionContext: SelectionContext): string =>
  buildSelectionContextSummary(selectionContext);

const copyText = async (text: string): Promise<boolean> => {
  if (target.navigator?.clipboard?.writeText) {
    try {
      await target.navigator.clipboard.writeText(text);
      return true;
    } catch (_error) {
      // fallback below
    }
  }

  try {
    const textAreaElement = document.createElement('textarea');
    textAreaElement.value = text;
    textAreaElement.style.position = 'fixed';
    textAreaElement.style.left = '-9999px';
    document.body.appendChild(textAreaElement);
    textAreaElement.select();
    const didCopy = document.execCommand('copy');
    textAreaElement.remove();
    return didCopy;
  } catch (_error) {
    return false;
  }
};

const getNormalizedSourceRoot = (): string =>
  normalizeSourceRoot(target.__AGENTIC_REACT_CONFIG__?.sourceRoot);

const extractRawSourceFromViteModule = (moduleText: string): string | null => {
  const trimmedText = moduleText.trim();
  const defaultExportMatch = trimmedText.match(
    /^export\s+default\s+((?:"(?:\\.|[^"])*")|(?:'(?:\\.|[^'])*'));\s*(?:\/\/# sourceMappingURL=[\s\S]*)?$/,
  );

  if (!defaultExportMatch) {
    return null;
  }

  const exportedValueText = defaultExportMatch[1]?.trim();
  if (!exportedValueText) {
    return null;
  }

  if (
    (exportedValueText.startsWith('"') && exportedValueText.endsWith('"')) ||
    (exportedValueText.startsWith("'") && exportedValueText.endsWith("'"))
  ) {
    try {
      const normalizedQuotedText = exportedValueText.startsWith("'")
        ? `"${exportedValueText
            .slice(1, -1)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')}"`
        : exportedValueText;
      return JSON.parse(normalizedQuotedText);
    } catch (_error) {
      return null;
    }
  }

  return null;
};

const normalizeSourceTextFromViteResponse = (
  responseText: string,
): string | null => {
  const rawSource = extractRawSourceFromViteModule(responseText);
  if (rawSource) {
    return rawSource;
  }

  if (responseText.includes('/node_modules/.vite/deps/')) {
    return null;
  }

  return responseText;
};

const buildSourceSnippet = (
  sourceText: string,
  lineNumber: number,
  contextLines: number,
): { startLine: number; endLine: number; snippet: string } | null => {
  const lines = sourceText.split(/\r?\n/);
  if (lines.length === 0) {
    return null;
  }

  const safeLineNumber = Math.max(1, Math.min(lineNumber, lines.length));
  const startLine = Math.max(1, safeLineNumber - contextLines);
  const endLine = Math.min(lines.length, safeLineNumber + contextLines);
  const snippet = lines
    .slice(startLine - 1, endLine)
    .join('\n')
    .trim();

  if (!snippet) {
    return null;
  }

  return {
    startLine,
    endLine,
    snippet,
  };
};

export const createSelectionToolkit = (
  options: ToolkitRuntimeOptions = {},
): ToolkitRuntimeResult => {
  let toolkitConfig = mergeToolkitConfig(options.initialConfig, undefined);
  let isToolkitVisible = toolkitConfig.defaultVisible && toolkitConfig.enabled;
  let isPanelOpen = toolkitConfig.defaultExpanded;
  let isSelectionMode = false;
  let lastSelectionContext: SelectionContext | null = null;

  const toolkitRootElement = document.createElement('div');
  const launcherButtonElement = document.createElement('button');
  const launcherIconElement = document.createElement('img');

  const panelElement = document.createElement('div');
  const selectButtonElement = document.createElement('button');
  const copyButtonElement = document.createElement('button');
  const statusElement = document.createElement('div');
  const hoverElement = document.createElement('div');
  const selectedElement = document.createElement('div');
  const dimElements = Array.from({ length: 4 }, () =>
    document.createElement('div'),
  );
  let selectedTargetElement: Element | null = null;
  let dimTargetElement: Element | null = null;
  let dimHideTimeout: number | null = null;
  let selectedPulseTimeout: number | null = null;

  toolkitRootElement.setAttribute('data-agentic-react-toolkit', 'true');
  toolkitRootElement.style.position = 'fixed';
  toolkitRootElement.style.display = 'flex';
  toolkitRootElement.style.flexDirection = 'column';
  toolkitRootElement.style.alignItems = 'flex-end';
  toolkitRootElement.style.gap = '10px';
  toolkitRootElement.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
  toolkitRootElement.style.pointerEvents = 'auto';

  launcherButtonElement.setAttribute('type', 'button');
  launcherButtonElement.setAttribute(
    'aria-label',
    'Open Agentic React toolkit',
  );
  launcherButtonElement.style.width = `${LAUNCHER_SIZE}px`;
  launcherButtonElement.style.height = `${LAUNCHER_SIZE}px`;
  launcherButtonElement.style.borderRadius = '999px';
  launcherButtonElement.style.border = 'none';
  launcherButtonElement.style.background = 'transparent';
  launcherButtonElement.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.38)';
  launcherButtonElement.style.cursor = 'pointer';
  launcherButtonElement.style.display = 'flex';
  launcherButtonElement.style.alignItems = 'center';
  launcherButtonElement.style.justifyContent = 'center';
  launcherButtonElement.style.padding = '0';
  launcherButtonElement.style.overflow = 'hidden';

  launcherIconElement.style.width = '100%';
  launcherIconElement.style.height = '100%';
  launcherIconElement.style.objectFit = 'cover';
  launcherIconElement.style.display = 'block';

  launcherButtonElement.appendChild(launcherIconElement);

  panelElement.style.display = 'none';
  panelElement.style.flexDirection = 'column';
  panelElement.style.gap = '8px';
  panelElement.style.background = 'rgba(255,255,255,0.96)';
  panelElement.style.border = '1px solid rgba(0,0,0,0.12)';
  panelElement.style.borderRadius = '10px';
  panelElement.style.padding = '10px';
  panelElement.style.minWidth = '206px';
  panelElement.style.maxWidth = '280px';
  panelElement.style.boxShadow = '0 16px 35px rgba(15, 23, 42, 0.26)';

  const createButton = (buttonElement: HTMLButtonElement, label: string) => {
    buttonElement.textContent = label;
    buttonElement.style.padding = '8px 12px';
    buttonElement.style.borderRadius = '8px';
    buttonElement.style.border = '1px solid rgba(255,255,255,0.2)';
    buttonElement.style.background = toolkitConfig.accentColor;
    buttonElement.style.color = '#ffffff';
    buttonElement.style.fontSize = '12px';
    buttonElement.style.fontWeight = '600';
    buttonElement.style.cursor = 'pointer';
    buttonElement.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    buttonElement.style.minWidth = '96px';
  };

  createButton(selectButtonElement, 'Select');
  createButton(copyButtonElement, 'Copy');

  copyButtonElement.style.background = '#1f2937';
  copyButtonElement.disabled = true;
  copyButtonElement.style.opacity = '0.6';
  copyButtonElement.style.cursor = 'not-allowed';

  statusElement.style.fontSize = '11px';
  statusElement.style.color = '#111827';
  statusElement.style.background = 'rgba(255, 255, 255, 0.95)';
  statusElement.style.border = '1px solid rgba(0,0,0,0.1)';
  statusElement.style.borderRadius = '8px';
  statusElement.style.padding = '6px 8px';
  statusElement.style.maxWidth = '280px';
  statusElement.style.display = 'none';

  panelElement.appendChild(selectButtonElement);
  panelElement.appendChild(copyButtonElement);
  panelElement.appendChild(statusElement);

  toolkitRootElement.appendChild(panelElement);
  toolkitRootElement.appendChild(launcherButtonElement);

  hoverElement.setAttribute('data-agentic-react-hover', 'true');
  hoverElement.style.position = 'fixed';
  hoverElement.style.pointerEvents = 'none';
  hoverElement.style.display = 'none';
  hoverElement.style.setProperty('--agentic-react-hover-inner', CONTRAST_DARK);
  hoverElement.style.setProperty('--agentic-react-hover-outer', CONTRAST_LIGHT);
  hoverElement.style.setProperty(
    '--agentic-react-hover-fill',
    'rgba(15, 23, 42, 0.08)',
  );

  selectedElement.setAttribute('data-agentic-react-selected', 'true');
  selectedElement.style.position = 'fixed';
  selectedElement.style.pointerEvents = 'none';
  selectedElement.style.display = 'none';
  selectedElement.style.background = 'transparent';

  for (const dimElement of dimElements) {
    dimElement.setAttribute('data-agentic-react-dim', 'true');
    dimElement.style.position = 'fixed';
    dimElement.style.pointerEvents = 'none';
    dimElement.style.display = 'none';
    dimElement.style.background = 'rgba(15, 23, 42, 0.28)';
    dimElement.style.backdropFilter = 'saturate(0.8)';
  }

  const mountSelectionStyles = () => {
    if (document.getElementById(SELECTION_STYLE_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = SELECTION_STYLE_ID;
    styleElement.textContent = `
      [data-agentic-react-selected="true"] {
        box-sizing: border-box;
        border: 2px solid rgba(255, 255, 255, 0.98);
        box-shadow:
          0 0 0 2px rgba(15, 23, 42, 0.96),
          0 0 0 6px rgba(255, 255, 255, 0.96),
          0 0 0 9px var(--agentic-react-selection-accent, #111827),
          0 16px 38px rgba(15, 23, 42, 0.22);
        transform-origin: center;
      }

      [data-agentic-react-hover="true"] {
        box-sizing: border-box;
        border: 2px solid var(--agentic-react-hover-inner, rgba(15, 23, 42, 0.98));
        background: var(--agentic-react-hover-fill, rgba(15, 23, 42, 0.08));
        box-shadow:
          0 0 0 2px var(--agentic-react-hover-outer, rgba(255, 255, 255, 0.98)),
          0 0 0 5px var(--agentic-react-selection-accent, #111827),
          inset 0 0 0 1px rgba(255, 255, 255, 0.18),
          0 12px 30px rgba(15, 23, 42, 0.2);
        transform: translateZ(0);
      }

      [data-agentic-react-selected="true"].agentic-react-selection-pulse {
        animation: agentic-react-selection-pulse ${SELECTION_CONFIRMATION_MS}ms ease-out;
      }

      @keyframes agentic-react-selection-pulse {
        0% {
          transform: scale(0.985);
          box-shadow:
            0 0 0 2px rgba(15, 23, 42, 0.96),
            0 0 0 6px rgba(255, 255, 255, 0.96),
            0 0 0 9px var(--agentic-react-selection-accent, #111827),
            0 16px 38px rgba(15, 23, 42, 0.22);
        }
        46% {
          transform: scale(1.012);
          box-shadow:
            0 0 0 3px rgba(15, 23, 42, 0.98),
            0 0 0 8px rgba(255, 255, 255, 0.98),
            0 0 0 15px var(--agentic-react-selection-accent, #111827),
            0 20px 46px rgba(15, 23, 42, 0.28);
        }
        100% {
          transform: scale(1);
          box-shadow:
            0 0 0 2px rgba(15, 23, 42, 0.96),
            0 0 0 6px rgba(255, 255, 255, 0.96),
            0 0 0 9px var(--agentic-react-selection-accent, #111827),
            0 16px 38px rgba(15, 23, 42, 0.22);
        }
      }
    `;
    (document.head || document.documentElement).appendChild(styleElement);
  };

  const updateStatus = (message: string, shouldDisplay = true) => {
    statusElement.textContent = message;
    statusElement.style.display = shouldDisplay ? 'block' : 'none';
  };

  const renderPanelVisibility = () => {
    panelElement.style.display = isPanelOpen ? 'flex' : 'none';
  };

  const renderLauncherLogo = () => {
    launcherIconElement.src =
      (toolkitConfig.iconUrl || '').trim() || DEFAULT_TOOLKIT_ICON_DATA_URL;
  };

  const updateToolkitStyle = () => {
    toolkitRootElement.style.zIndex = String(toolkitConfig.zIndex);
    setPosition(
      toolkitRootElement,
      toolkitConfig.position,
      toolkitConfig.offset.x || 0,
      toolkitConfig.offset.y || 0,
    );

    panelElement.style.borderColor = `${toolkitConfig.accentColor}33`;
    launcherButtonElement.style.boxShadow = `0 12px 28px ${toolkitConfig.accentColor}66`;

    const buttons = [selectButtonElement, copyButtonElement];
    for (const buttonElement of buttons) {
      if (!buttonElement.disabled) {
        buttonElement.style.background = toolkitConfig.accentColor;
      }
      buttonElement.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    }

    hoverElement.style.zIndex = String(Math.max(0, toolkitConfig.zIndex - 2));
    hoverElement.style.setProperty(
      '--agentic-react-selection-accent',
      toolkitConfig.accentColor,
    );
    selectedElement.style.zIndex = String(
      Math.max(0, toolkitConfig.zIndex - 1),
    );
    selectedElement.style.setProperty(
      '--agentic-react-selection-accent',
      toolkitConfig.accentColor,
    );
    for (const dimElement of dimElements) {
      dimElement.style.zIndex = String(Math.max(0, toolkitConfig.zIndex - 3));
    }
    renderLauncherLogo();
    renderPanelVisibility();
  };

  const applyElementRect = (overlayElement: HTMLElement, rect: DOMRect) => {
    overlayElement.style.left = `${rect.left}px`;
    overlayElement.style.top = `${rect.top}px`;
    overlayElement.style.width = `${rect.width}px`;
    overlayElement.style.height = `${rect.height}px`;
  };

  const hideDimOverlay = () => {
    dimTargetElement = null;
    if (dimHideTimeout !== null) {
      window.clearTimeout(dimHideTimeout);
      dimHideTimeout = null;
    }

    for (const dimElement of dimElements) {
      dimElement.style.display = 'none';
    }
  };

  const showDimForElement = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const topHeight = Math.max(0, rect.top);
    const bottomTop = Math.min(viewportHeight, Math.max(0, rect.bottom));
    const leftWidth = Math.max(0, rect.left);
    const rightLeft = Math.min(viewportWidth, Math.max(0, rect.right));
    const middleTop = Math.max(0, rect.top);
    const middleHeight = Math.max(
      0,
      Math.min(viewportHeight, rect.bottom) - middleTop,
    );

    dimTargetElement = element;

    const [topElement, rightElement, bottomElement, leftElement] = dimElements;
    topElement.style.display = 'block';
    topElement.style.left = '0px';
    topElement.style.top = '0px';
    topElement.style.width = `${viewportWidth}px`;
    topElement.style.height = `${topHeight}px`;

    rightElement.style.display = 'block';
    rightElement.style.left = `${rightLeft}px`;
    rightElement.style.top = `${middleTop}px`;
    rightElement.style.width = `${Math.max(0, viewportWidth - rightLeft)}px`;
    rightElement.style.height = `${middleHeight}px`;

    bottomElement.style.display = 'block';
    bottomElement.style.left = '0px';
    bottomElement.style.top = `${bottomTop}px`;
    bottomElement.style.width = `${viewportWidth}px`;
    bottomElement.style.height = `${Math.max(0, viewportHeight - bottomTop)}px`;

    leftElement.style.display = 'block';
    leftElement.style.left = '0px';
    leftElement.style.top = `${middleTop}px`;
    leftElement.style.width = `${leftWidth}px`;
    leftElement.style.height = `${middleHeight}px`;
  };

  const scheduleDimHide = () => {
    if (dimHideTimeout !== null) {
      window.clearTimeout(dimHideTimeout);
    }

    dimHideTimeout = window.setTimeout(() => {
      hideDimOverlay();
    }, SELECTION_CONFIRMATION_MS);
  };

  const hideHoverOverlay = () => {
    hoverElement.style.display = 'none';
  };

  const showHoverForElement = (element: Element | null) => {
    if (!element || toolkitRootElement.contains(element)) {
      hideHoverOverlay();
      if (isSelectionMode) {
        hideDimOverlay();
      }
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    hoverElement.style.display = 'block';
    hoverElement.style.borderRadius = computedStyle.borderRadius || '6px';
    applyHoverContrastForElement(hoverElement, element);
    applyElementRect(hoverElement, rect);
    showDimForElement(element);
  };

  const hideSelectedOverlay = () => {
    selectedTargetElement = null;
    selectedElement.style.display = 'none';
    selectedElement.classList.remove('agentic-react-selection-pulse');
    if (selectedPulseTimeout !== null) {
      window.clearTimeout(selectedPulseTimeout);
      selectedPulseTimeout = null;
    }
  };

  const showSelectedForElement = (element: Element, shouldPulse = false) => {
    if (toolkitRootElement.contains(element)) {
      hideSelectedOverlay();
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    selectedTargetElement = element;
    selectedElement.style.display = 'block';
    selectedElement.style.borderRadius = computedStyle.borderRadius || '6px';
    applyElementRect(selectedElement, rect);

    if (!shouldPulse) {
      return;
    }

    selectedElement.classList.remove('agentic-react-selection-pulse');
    void selectedElement.offsetWidth;
    selectedElement.classList.add('agentic-react-selection-pulse');

    if (selectedPulseTimeout !== null) {
      window.clearTimeout(selectedPulseTimeout);
    }
    selectedPulseTimeout = window.setTimeout(() => {
      selectedElement.classList.remove('agentic-react-selection-pulse');
      selectedPulseTimeout = null;
    }, SELECTION_CONFIRMATION_MS);
  };

  const updateSelectionOverlays = () => {
    if (selectedTargetElement?.isConnected) {
      showSelectedForElement(selectedTargetElement);
    } else if (selectedTargetElement) {
      hideSelectedOverlay();
    }

    if (dimTargetElement?.isConnected) {
      showDimForElement(dimTargetElement);
    } else if (dimTargetElement) {
      hideDimOverlay();
    }
  };

  const isToolkitElement = (element: Element) =>
    toolkitRootElement.contains(element) ||
    hoverElement.contains(element) ||
    selectedElement.contains(element) ||
    dimElements.some((dimElement) => dimElement.contains(element));

  const getSelectableElement = (clientX: number, clientY: number) =>
    getSelectableElementAtPosition(clientX, clientY, isToolkitElement);

  const onMouseMove = (mouseEvent: MouseEvent) => {
    if (!isSelectionMode) return;

    showHoverForElement(
      getSelectableElement(mouseEvent.clientX, mouseEvent.clientY),
    );
  };

  const onSelect = async (mouseEvent: MouseEvent) => {
    if (!isSelectionMode) {
      const clickTarget = mouseEvent.target;
      if (
        isPanelOpen &&
        clickTarget instanceof Node &&
        !toolkitRootElement.contains(clickTarget)
      ) {
        isPanelOpen = false;
        renderPanelVisibility();
      }
      return;
    }

    const selectedTarget = getSelectableElement(
      mouseEvent.clientX,
      mouseEvent.clientY,
    );

    if (!selectedTarget) {
      return;
    }

    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    mouseEvent.stopImmediatePropagation();

    let didCaptureSelection = false;

    try {
      const selectionContext =
        await buildSelectionContextForElement(selectedTarget);
      lastSelectionContext = selectionContext;
      copyButtonElement.disabled = false;
      copyButtonElement.style.opacity = '1';
      copyButtonElement.style.cursor = 'pointer';
      copyButtonElement.style.background = toolkitConfig.accentColor;
      showSelectedForElement(selectedTarget, true);
      showDimForElement(selectedTarget);
      scheduleDimHide();
      didCaptureSelection = true;
      isPanelOpen = true;
      renderPanelVisibility();
      updateStatus(
        `Captured ${selectionContext.componentName || 'selection'}${selectionContext.selector ? ` (${selectionContext.selector})` : ''}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to capture selection context';
      updateStatus(message);
    } finally {
      isSelectionMode = false;
      selectButtonElement.textContent = 'Select';
      launcherButtonElement.setAttribute(
        'aria-label',
        'Open Agentic React toolkit',
      );
      hideHoverOverlay();
      if (!didCaptureSelection) {
        hideDimOverlay();
      }
      clearSelectableElementCache();
    }
  };

  const enterSelectionMode = () => {
    isSelectionMode = true;
    clearSelectableElementCache();
    hideSelectedOverlay();
    isPanelOpen = true;
    renderPanelVisibility();
    selectButtonElement.textContent = 'Selecting...';
    launcherButtonElement.setAttribute(
      'aria-label',
      'Selection mode active for Agentic React toolkit',
    );
    updateStatus(
      'Selection mode enabled. Click any element to capture context.',
    );
  };

  const exitSelectionMode = () => {
    isSelectionMode = false;
    selectButtonElement.textContent = 'Select';
    launcherButtonElement.setAttribute(
      'aria-label',
      'Open Agentic React toolkit',
    );
    hideHoverOverlay();
    hideDimOverlay();
    clearSelectableElementCache();
  };

  const togglePanel = () => {
    isPanelOpen = !isPanelOpen;
    if (!isPanelOpen) {
      exitSelectionMode();
    }
    renderPanelVisibility();
  };

  const showToolkit = () => {
    isToolkitVisible = true;
    toolkitRootElement.style.display = toolkitConfig.enabled ? 'flex' : 'none';
  };

  const hideToolkit = () => {
    isToolkitVisible = false;
    toolkitRootElement.style.display = 'none';
    exitSelectionMode();
    hideSelectedOverlay();
  };

  const setToolkitConfig = (config: Partial<ToolkitConfig>) => {
    toolkitConfig = mergeToolkitConfig(toolkitConfig, config);
    updateToolkitStyle();

    if (!toolkitConfig.enabled) {
      hideToolkit();
    } else if (isToolkitVisible) {
      showToolkit();
    }

    return toolkitConfig;
  };

  const getLastSelectionContext = (): SelectionContext | null => {
    return lastSelectionContext;
  };

  const copyLastSelectionContext = async (
    format: 'text' | 'json' = 'text',
  ): Promise<{
    success: boolean;
    copied: boolean;
    format: 'text' | 'json';
    context?: SelectionContext;
    error?: string;
  }> => {
    if (!lastSelectionContext) {
      return {
        success: false,
        copied: false,
        format,
        error: 'No selection context found',
      };
    }

    if (lastSelectionContext.sourceSnippets.length === 0) {
      const sourceSnippets: SelectionContext['sourceSnippets'] = [];
      const resolvedSources = lastSelectionContext.resolvedSources.slice(
        0,
        DEFAULT_MAX_SNIPPET_FILES,
      );
      const normalizedSourceRoot = getNormalizedSourceRoot();

      for (const resolvedSource of resolvedSources) {
        if (
          !isAllowedProjectSourcePath(
            resolvedSource.filePath,
            normalizedSourceRoot,
          )
        ) {
          continue;
        }

        if (!resolvedSource.lineNumber || resolvedSource.lineNumber < 1) {
          continue;
        }

        const candidateUrls = buildBrowserSourceCandidates(
          resolvedSource.filePath,
          normalizedSourceRoot,
        );
        if (candidateUrls.length === 0) {
          continue;
        }

        for (const candidateUrl of candidateUrls) {
          try {
            const response = await fetch(candidateUrl, { cache: 'no-store' });
            if (!response.ok) {
              continue;
            }

            const sourceTextResponse = await response.text();
            const sourceText =
              normalizeSourceTextFromViteResponse(sourceTextResponse);
            if (!sourceText) {
              continue;
            }
            const snippetPayload = buildSourceSnippet(
              sourceText,
              resolvedSource.lineNumber,
              DEFAULT_SNIPPET_CONTEXT_LINES,
            );

            if (!snippetPayload) {
              continue;
            }

            sourceSnippets.push({
              filePath: resolvedSource.filePath,
              startLine: snippetPayload.startLine,
              endLine: snippetPayload.endLine,
              snippet: snippetPayload.snippet,
            });
            break;
          } catch (_error) {
            // best effort only
          }
        }
      }

      if (sourceSnippets.length > 0) {
        const enrichedSelectionContext = {
          ...lastSelectionContext,
          sourceSnippets,
        };
        lastSelectionContext = {
          ...enrichedSelectionContext,
          sourcePreview: buildSelectionSourcePreview(enrichedSelectionContext),
        };
      }
    }

    const textToCopy =
      format === 'json'
        ? JSON.stringify(lastSelectionContext, null, 2)
        : toTextContext(lastSelectionContext);
    const copied = await copyText(textToCopy);

    if (!copied) {
      return {
        success: false,
        copied: false,
        format,
        context: lastSelectionContext,
        error: 'Failed to copy context to clipboard',
      };
    }

    updateStatus('Copied last selection context');

    return {
      success: true,
      copied: true,
      format,
      context: lastSelectionContext,
    };
  };

  launcherButtonElement.addEventListener('click', () => {
    togglePanel();
  });

  selectButtonElement.addEventListener('click', () => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  });

  copyButtonElement.addEventListener('click', () => {
    void copyLastSelectionContext('text');
  });

  const mountToolkit = () => {
    if (!document.body) {
      return false;
    }

    mountSelectionStyles();
    updateToolkitStyle();
    toolkitRootElement.style.display = isToolkitVisible ? 'flex' : 'none';

    for (const dimElement of dimElements) {
      if (!dimElement.isConnected) {
        document.body.appendChild(dimElement);
      }
    }
    if (!toolkitRootElement.isConnected) {
      document.body.appendChild(toolkitRootElement);
    }
    if (!hoverElement.isConnected) {
      document.body.appendChild(hoverElement);
    }
    if (!selectedElement.isConnected) {
      document.body.appendChild(selectedElement);
    }
    return true;
  };

  if (!mountToolkit()) {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        mountToolkit();
      },
      { once: true },
    );
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onSelect, true);
  document.addEventListener('scroll', updateSelectionOverlays, true);
  window.addEventListener('resize', updateSelectionOverlays);

  return {
    showToolkit,
    hideToolkit,
    setToolkitConfig,
    enterSelectionMode,
    exitSelectionMode,
    setSelectionMode: (enabled: boolean) => {
      if (enabled) {
        enterSelectionMode();
      } else {
        exitSelectionMode();
      }
    },
    getLastSelectionContext,
    copyLastSelectionContext,
  };
};
