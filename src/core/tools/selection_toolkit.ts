import { target } from '../../shared/const.js';
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
  iconUrl: null,
};

const DEFAULT_SNIPPET_CONTEXT_LINES = 4;
const DEFAULT_MAX_SNIPPET_FILES = 3;
const LAUNCHER_SIZE = 58;

const mergeToolkitConfig = (
  config: ToolkitConfig | undefined,
  nextConfig: Partial<ToolkitConfig> | undefined,
): Required<Omit<ToolkitConfig, 'iconUrl'>> & { iconUrl: string | null } => {
  const baseConfig = {
    ...DEFAULT_TOOLKIT_CONFIG,
    ...(config || {}),
    iconUrl: config?.iconUrl || null,
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

const toTextContext = (selectionContext: SelectionContext): string => {
  const lines: string[] = [];
  lines.push(selectionContext.domPreview);

  if (selectionContext.componentName) {
    lines.push(`in ${selectionContext.componentName}`);
  }

  if (selectionContext.selector) {
    lines.push(`selector: ${selectionContext.selector}`);
  }

  if (selectionContext.resolvedSources.length > 0) {
    lines.push('sources:');
    for (const source of selectionContext.resolvedSources) {
      const line = source.lineNumber != null ? `:${source.lineNumber}` : '';
      const column =
        source.columnNumber != null ? `:${source.columnNumber}` : '';
      lines.push(`- ${source.filePath}${line}${column}`);
    }
  }

  if (selectionContext.sourceSnippets.length > 0) {
    lines.push('source snippets:');
    for (const sourceSnippet of selectionContext.sourceSnippets) {
      lines.push(
        `- ${sourceSnippet.filePath}:${sourceSnippet.startLine}-${sourceSnippet.endLine}`,
      );
      lines.push(sourceSnippet.snippet);
    }
  }

  return lines.join('\n');
};

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
  (target.__VITE_REACT_MCP_CONFIG__?.sourceRoot || '')
    .replace(/\\/g, '/')
    .replace(/\/$/, '');

const isWithinSourceRoot = (filePath: string, sourceRoot: string): boolean =>
  Boolean(
    sourceRoot &&
      (filePath === sourceRoot || filePath.startsWith(`${sourceRoot}/`)),
  );

const toCandidateSourceUrls = (filePath: string): string[] => {
  if (!filePath || filePath.includes('://')) {
    return [];
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  if (normalizedPath.startsWith('/@fs/')) {
    return [`${normalizedPath}?raw`, normalizedPath];
  }

  if (normalizedPath.startsWith('/')) {
    if (isWithinSourceRoot(normalizedPath, getNormalizedSourceRoot())) {
      return [`/@fs${normalizedPath}?raw`, `/@fs${normalizedPath}`];
    }

    return [`${normalizedPath}?raw`, normalizedPath];
  }

  const sanitizedPath = normalizedPath.replace(/^\.?\//, '');
  return [`/${sanitizedPath}?raw`, `/${sanitizedPath}`];
};

const isProjectSourceFilePath = (filePath: string): boolean => {
  if (!filePath) {
    return false;
  }

  if (filePath.includes('\0')) {
    return false;
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/').filter(Boolean);
  if (pathSegments.includes('node_modules') || pathSegments.includes('.vite')) {
    return false;
  }

  if (!/\.(jsx?|tsx?)$/i.test(normalizedPath)) {
    return false;
  }

  if (!normalizedPath.startsWith('/')) {
    return !pathSegments.includes('..');
  }

  const normalizedSourceRoot = getNormalizedSourceRoot();

  if (normalizedPath.startsWith('/@fs/')) {
    const fileSystemPath = normalizedPath.slice('/@fs'.length);
    return isWithinSourceRoot(fileSystemPath, normalizedSourceRoot);
  }

  if (normalizedPath.startsWith('/src/')) {
    return true;
  }

  return isWithinSourceRoot(normalizedPath, normalizedSourceRoot);
};

const extractRawSourceFromViteModule = (moduleText: string): string | null => {
  const trimmedText = moduleText.trim();
  const defaultExportMatch = trimmedText.match(
    /^export\s+default\s+([\s\S]+?);?$/,
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
  const launcherFallbackElement = document.createElement('span');

  const panelElement = document.createElement('div');
  const selectButtonElement = document.createElement('button');
  const copyButtonElement = document.createElement('button');
  const statusElement = document.createElement('div');
  const hoverElement = document.createElement('div');

  toolkitRootElement.setAttribute('data-vite-react-mcp-toolkit', 'true');
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
    'Open Vite React MCP toolkit',
  );
  launcherButtonElement.style.width = `${LAUNCHER_SIZE}px`;
  launcherButtonElement.style.height = `${LAUNCHER_SIZE}px`;
  launcherButtonElement.style.borderRadius = '999px';
  launcherButtonElement.style.border = 'none';
  launcherButtonElement.style.background =
    'radial-gradient(circle at 30% 25%, #67e8f9 0%, #2563eb 44%, #0f172a 100%)';
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
  launcherIconElement.style.display = 'none';

  launcherFallbackElement.textContent = 'M';
  launcherFallbackElement.style.color = '#e2e8f0';
  launcherFallbackElement.style.fontWeight = '700';
  launcherFallbackElement.style.fontSize = '20px';
  launcherFallbackElement.style.letterSpacing = '0.04em';

  launcherButtonElement.appendChild(launcherIconElement);
  launcherButtonElement.appendChild(launcherFallbackElement);

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

  hoverElement.setAttribute('data-vite-react-mcp-hover', 'true');
  hoverElement.style.position = 'fixed';
  hoverElement.style.pointerEvents = 'none';
  hoverElement.style.border = `2px solid ${toolkitConfig.accentColor}`;
  hoverElement.style.backgroundColor = 'rgba(17, 24, 39, 0.08)';
  hoverElement.style.zIndex = String(toolkitConfig.zIndex + 1);
  hoverElement.style.display = 'none';

  const updateStatus = (message: string, shouldDisplay = true) => {
    statusElement.textContent = message;
    statusElement.style.display = shouldDisplay ? 'block' : 'none';
  };

  const renderPanelVisibility = () => {
    panelElement.style.display = isPanelOpen ? 'flex' : 'none';
  };

  const renderLauncherLogo = () => {
    const iconUrl = (toolkitConfig.iconUrl || '').trim();
    if (iconUrl) {
      launcherIconElement.src = iconUrl;
      launcherIconElement.style.display = 'block';
      launcherFallbackElement.style.display = 'none';
      return;
    }

    launcherIconElement.removeAttribute('src');
    launcherIconElement.style.display = 'none';
    launcherFallbackElement.style.display = 'block';
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

    hoverElement.style.border = `2px solid ${toolkitConfig.accentColor}`;
    renderLauncherLogo();
    renderPanelVisibility();
  };

  const showHoverForElement = (element: Element | null) => {
    if (!element || toolkitRootElement.contains(element)) {
      hoverElement.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    hoverElement.style.display = 'block';
    hoverElement.style.left = `${rect.left}px`;
    hoverElement.style.top = `${rect.top}px`;
    hoverElement.style.width = `${rect.width}px`;
    hoverElement.style.height = `${rect.height}px`;
  };

  const isToolkitElement = (element: Element) =>
    toolkitRootElement.contains(element) || hoverElement.contains(element);

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

    const selectedElement = getSelectableElement(
      mouseEvent.clientX,
      mouseEvent.clientY,
    );

    if (!selectedElement) {
      return;
    }

    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    mouseEvent.stopImmediatePropagation();

    try {
      const selectionContext =
        await buildSelectionContextForElement(selectedElement);
      lastSelectionContext = selectionContext;
      copyButtonElement.disabled = false;
      copyButtonElement.style.opacity = '1';
      copyButtonElement.style.cursor = 'pointer';
      copyButtonElement.style.background = toolkitConfig.accentColor;
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
        'Open Vite React MCP toolkit',
      );
      showHoverForElement(null);
      clearSelectableElementCache();
    }
  };

  const enterSelectionMode = () => {
    isSelectionMode = true;
    clearSelectableElementCache();
    isPanelOpen = true;
    renderPanelVisibility();
    selectButtonElement.textContent = 'Selecting...';
    launcherButtonElement.setAttribute(
      'aria-label',
      'Selection mode active for Vite React MCP toolkit',
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
      'Open Vite React MCP toolkit',
    );
    showHoverForElement(null);
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

      for (const resolvedSource of resolvedSources) {
        if (!isProjectSourceFilePath(resolvedSource.filePath)) {
          continue;
        }

        if (!resolvedSource.lineNumber || resolvedSource.lineNumber < 1) {
          continue;
        }

        const candidateUrls = toCandidateSourceUrls(resolvedSource.filePath);
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
        lastSelectionContext = {
          ...lastSelectionContext,
          sourceSnippets,
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

    updateToolkitStyle();
    toolkitRootElement.style.display = isToolkitVisible ? 'flex' : 'none';

    if (!toolkitRootElement.isConnected) {
      document.body.appendChild(toolkitRootElement);
    }
    if (!hoverElement.isConnected) {
      document.body.appendChild(hoverElement);
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
