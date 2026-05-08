import {
  type Fiber,
  getDisplayName,
  getFiberFromHostInstance,
  getFiberStack,
  isCompositeFiber,
  isInstrumentationActive,
  traverseFiber,
} from 'bippy';
import {
  type StackFrame,
  formatOwnerStack,
  getOwnerStack,
  getSource,
  hasDebugStack,
  isSourceFile,
  normalizeFileName,
  parseStack,
} from 'bippy/source';
import { buildSelectionSourcePreview } from '../../shared/selection_context_format.js';
import type {
  SelectionContext,
  SelectionResolvedSource,
  SelectionStackFrame,
} from '../../shared/types.js';
import { getDisplayNameForFiber } from '../../shared/util.js';
import { createElementSelector } from './selection_selector.js';

const MAX_HTML_PREVIEW_LENGTH = 1200;
const MAX_STACK_FRAMES = 24;
const MAX_SOURCE_FRAMES = 12;

const NON_COMPONENT_PREFIXES = [
  '_',
  '$',
  'motion.',
  'styled.',
  'chakra.',
  'ark.',
  'Primitive.',
  'Slot.',
];

const INTERNAL_COMPONENT_NAMES = new Set([
  'Suspense',
  'Fragment',
  'StrictMode',
  'Profiler',
  'SuspenseList',
  'Activity',
  'Cache',
  'root',
  'createRoot()',
  'SlotClone',
  'InnerLayoutRouter',
  'RedirectErrorBoundary',
  'RedirectBoundary',
  'HTTPAccessFallbackErrorBoundary',
  'HTTPAccessFallbackBoundary',
  'LoadingBoundary',
  'ErrorBoundary',
  'InnerScrollAndFocusHandler',
  'ScrollAndFocusHandler',
  'RenderFromTemplateContext',
  'OuterLayoutRouter',
  'body',
  'html',
  'DevRootHTTPAccessFallbackBoundary',
  'AppDevOverlayErrorBoundary',
  'AppDevOverlay',
  'HotReload',
  'Router',
  'ErrorBoundaryHandler',
  'AppRouter',
  'ServerRoot',
  'SegmentStateProvider',
  'RootErrorBoundary',
  'LoadableComponent',
  'MotionDOMComponent',
]);

const SERVER_COMPONENT_URL_PREFIXES = ['about://React/', 'rsc://React/'];
const SYMBOLICATION_TIMEOUT_MS = 5000;

const isUsefulComponentName = (name: string | null): boolean => {
  if (!name) return false;
  if (INTERNAL_COMPONENT_NAMES.has(name)) return false;
  for (const prefix of NON_COMPONENT_PREFIXES) {
    if (name.startsWith(prefix)) return false;
  }
  return true;
};

const isSourceComponentName = (name: string | null): boolean => {
  if (!isUsefulComponentName(name)) return false;
  if (!name) return false;
  if (name.length < 2) return false;
  if (name[0] !== name[0].toUpperCase()) return false;
  if (name.endsWith('Provider') || name.endsWith('Context')) return false;
  return true;
};

const inferComponentNameFromSource = (
  filePath: string,
  functionName: string | null,
): string | null => {
  if (functionName && isUsefulComponentName(functionName)) {
    return functionName;
  }

  const fileName =
    filePath
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '') ?? '';
  return /^[A-Z][A-Za-z0-9]*$/.test(fileName) ? fileName : null;
};

const normalizeSourceFilePath = (fileName: string): string => {
  let normalizedFileName = normalizeFileName(fileName);
  normalizedFileName = normalizedFileName.replace(
    /^(?:\.\/)?\/?\([a-z][a-z0-9-]*\)\//,
    '',
  );
  if (normalizedFileName.startsWith('./')) {
    normalizedFileName = normalizedFileName.slice(2);
  }
  return normalizedFileName.replace(/\?.*$/, '');
};

const isProjectSourceFrame = (fileName: string): boolean => {
  if (!isSourceFile(fileName)) {
    return false;
  }

  const normalizedFileName = normalizeSourceFilePath(fileName);
  const pathSegments = normalizedFileName.split('/').filter(Boolean);
  return (
    !pathSegments.includes('node_modules') &&
    !pathSegments.includes('.vite') &&
    !normalizedFileName.includes('/@vite/')
  );
};

const isServerComponentUrl = (url: string): boolean =>
  SERVER_COMPONENT_URL_PREFIXES.some((prefix) => url.startsWith(prefix));

const devirtualizeServerUrl = (url: string): string => {
  for (const prefix of SERVER_COMPONENT_URL_PREFIXES) {
    if (!url.startsWith(prefix)) continue;
    const environmentEndIndex = url.indexOf('/', prefix.length);
    const querySuffixIndex = url.lastIndexOf('?');
    if (environmentEndIndex > -1 && querySuffixIndex > -1) {
      return decodeURI(url.slice(environmentEndIndex + 1, querySuffixIndex));
    }
  }
  return url;
};

let cachedNextBasePath: string | undefined;

const getNextBasePath = (): string => {
  if (cachedNextBasePath !== undefined) return cachedNextBasePath;

  const source = document.querySelector<HTMLScriptElement>(
    'script[src*="/_next/"]',
  )?.src;
  const pathname = source ? new URL(source).pathname : '';
  const assetPathIndex = pathname.indexOf('/_next/');
  cachedNextBasePath =
    assetPathIndex > 0 ? pathname.slice(0, assetPathIndex) : '';
  return cachedNextBasePath;
};

const checkIsNextProject = (): boolean =>
  typeof document !== 'undefined' &&
  Boolean(
    document.getElementById('__NEXT_DATA__') ||
      document.querySelector('nextjs-portal'),
  );

const findNearestFiberElement = (element: Element): Element | null => {
  let currentElement: Element | null = element;
  while (currentElement) {
    if (getFiberFromHostInstance(currentElement)) {
      return currentElement;
    }
    currentElement = currentElement.parentElement;
  }
  return null;
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const getDomPreview = (element: Element): string => {
  if ('outerHTML' in element && typeof element.outerHTML === 'string') {
    return truncateText(element.outerHTML, MAX_HTML_PREVIEW_LENGTH);
  }

  const tagName = element.tagName ? element.tagName.toLowerCase() : 'unknown';
  return `<${tagName}>`;
};

const mapOwnerStackFrame = (stackFrame: StackFrame): SelectionStackFrame => {
  return {
    functionName: stackFrame.functionName || null,
    fileName: stackFrame.fileName
      ? normalizeSourceFilePath(stackFrame.fileName)
      : null,
    lineNumber: stackFrame.lineNumber ?? null,
    columnNumber: stackFrame.columnNumber ?? null,
  };
};

const symbolicateServerFrames = async (
  frames: StackFrame[],
): Promise<StackFrame[]> => {
  const serverFrameIndices: number[] = [];
  const requestFrames: Array<{
    file: string;
    methodName: string;
    line1: number | null;
    column1: number | null;
    arguments: string[];
  }> = [];

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frame = frames[frameIndex];
    if (!frame.isServer || !frame.fileName) continue;

    serverFrameIndices.push(frameIndex);
    requestFrames.push({
      file: devirtualizeServerUrl(frame.fileName),
      methodName: frame.functionName ?? '<unknown>',
      line1: frame.lineNumber ?? null,
      column1: frame.columnNumber ?? null,
      arguments: [],
    });
  }

  if (requestFrames.length === 0) return frames;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SYMBOLICATION_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${getNextBasePath()}/__nextjs_original-stack-frames`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: requestFrames,
          isServer: true,
          isEdgeServer: false,
          isAppDirectory: true,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) return frames;

    const results = (await response.json()) as Array<{
      status: string;
      value?: {
        originalStackFrame: {
          file: string | null;
          line1: number | null;
          column1: number | null;
          ignored: boolean;
        } | null;
      };
    }>;
    const resolvedFrames = [...frames];

    for (
      let resultIndex = 0;
      resultIndex < serverFrameIndices.length;
      resultIndex++
    ) {
      const result = results[resultIndex];
      if (result?.status !== 'fulfilled') continue;

      const resolved = result.value?.originalStackFrame;
      if (!resolved?.file || resolved.ignored) continue;

      const originalFrameIndex = serverFrameIndices[resultIndex];
      resolvedFrames[originalFrameIndex] = {
        ...frames[originalFrameIndex],
        fileName: resolved.file,
        lineNumber: resolved.line1 ?? undefined,
        columnNumber: resolved.column1 ?? undefined,
        isSymbolicated: true,
      };
    }

    return resolvedFrames;
  } catch (_error) {
    return frames;
  } finally {
    clearTimeout(timeout);
  }
};

const extractServerFramesFromDebugStack = (
  rootFiber: Fiber,
): Map<string, StackFrame> => {
  const serverFramesByName = new Map<string, StackFrame>();

  traverseFiber(
    rootFiber,
    (currentFiber) => {
      if (!hasDebugStack(currentFiber)) return false;

      const debugStack = currentFiber._debugStack?.stack;
      if (!debugStack) return false;

      const ownerStack = formatOwnerStack(debugStack);
      if (!ownerStack) return false;

      for (const frame of parseStack(ownerStack)) {
        if (!frame.functionName || !frame.fileName) continue;
        if (!isServerComponentUrl(frame.fileName)) continue;
        if (serverFramesByName.has(frame.functionName)) continue;

        serverFramesByName.set(frame.functionName, {
          ...frame,
          isServer: true,
        });
      }
      return false;
    },
    true,
  );

  return serverFramesByName;
};

const enrichServerFrameLocations = (
  rootFiber: Fiber,
  frames: StackFrame[],
): StackFrame[] => {
  const hasUnresolvedServerFrames = frames.some(
    (frame) => frame.isServer && !frame.fileName && frame.functionName,
  );
  if (!hasUnresolvedServerFrames) return frames;

  const serverFramesByName = extractServerFramesFromDebugStack(rootFiber);
  if (serverFramesByName.size === 0) return frames;

  return frames.map((frame) => {
    if (!frame.isServer || frame.fileName || !frame.functionName) return frame;
    const resolved = serverFramesByName.get(frame.functionName);
    if (!resolved) return frame;
    return {
      ...frame,
      fileName: resolved.fileName,
      lineNumber: resolved.lineNumber,
      columnNumber: resolved.columnNumber,
    };
  });
};

const getComponentDisplayName = (element: Element): string | null => {
  if (!isInstrumentationActive()) return null;
  const resolvedElement = findNearestFiberElement(element);
  if (!resolvedElement) return null;
  const fiber = getFiberFromHostInstance(resolvedElement);
  if (!fiber) return null;

  let currentFiber = fiber.return;
  while (currentFiber) {
    if (isCompositeFiber(currentFiber)) {
      const name = getDisplayName(currentFiber.type);
      if (name && isUsefulComponentName(name)) {
        return name;
      }
    }
    currentFiber = currentFiber.return;
  }

  return null;
};

const buildStackFrames = async (
  nearestFiberElement: Element,
): Promise<SelectionStackFrame[]> => {
  const fiber = getFiberFromHostInstance(nearestFiberElement);
  if (!fiber) {
    return [];
  }

  try {
    const ownerStack = checkIsNextProject()
      ? await symbolicateServerFrames(
          enrichServerFrameLocations(fiber, await getOwnerStack(fiber)),
        )
      : await getOwnerStack(fiber);
    return ownerStack.slice(0, MAX_STACK_FRAMES).map(mapOwnerStackFrame);
  } catch (_error) {
    const fallbackFiberStack = getFiberStack(fiber).slice(0, MAX_STACK_FRAMES);
    const stackFrames: SelectionStackFrame[] = [];

    for (const stackFiber of fallbackFiberStack) {
      const source = await getSource(stackFiber).catch(() => null);
      stackFrames.push({
        functionName: getDisplayNameForFiber(stackFiber),
        fileName: source?.fileName
          ? normalizeSourceFilePath(source.fileName)
          : null,
        lineNumber: source?.lineNumber ?? null,
        columnNumber: source?.columnNumber ?? null,
      });
    }

    return stackFrames;
  }
};

const resolveSourceFrames = (
  stackFrames: SelectionStackFrame[],
  preferredComponentName: string | null,
): SelectionResolvedSource[] => {
  const resolvedSources: SelectionResolvedSource[] = [];
  const seenSourceKeys = new Set<string>();
  const sourceFrames = stackFrames.filter(
    (stackFrame) =>
      stackFrame.fileName && isProjectSourceFrame(stackFrame.fileName),
  );
  const preferredSourceFrames = sourceFrames.filter((stackFrame) => {
    if (!stackFrame.fileName) {
      return false;
    }

    return (
      inferComponentNameFromSource(
        stackFrame.fileName,
        stackFrame.functionName,
      ) === preferredComponentName
    );
  });
  const sortedSourceFrames = [
    ...preferredSourceFrames,
    ...sourceFrames.filter((stackFrame) =>
      isSourceComponentName(stackFrame.functionName),
    ),
    ...sourceFrames.filter(
      (stackFrame) => !isSourceComponentName(stackFrame.functionName),
    ),
  ];

  for (const stackFrame of sortedSourceFrames) {
    if (!stackFrame.fileName) {
      continue;
    }

    const sourceKey = `${stackFrame.fileName}:${stackFrame.lineNumber ?? 0}:${stackFrame.columnNumber ?? 0}`;
    if (seenSourceKeys.has(sourceKey)) {
      continue;
    }

    const componentName = inferComponentNameFromSource(
      stackFrame.fileName,
      stackFrame.functionName,
    );
    seenSourceKeys.add(sourceKey);
    resolvedSources.push({
      filePath: stackFrame.fileName,
      lineNumber: stackFrame.lineNumber,
      columnNumber: stackFrame.columnNumber,
      componentName,
    });

    if (resolvedSources.length >= MAX_SOURCE_FRAMES) {
      break;
    }
  }

  return resolvedSources;
};

const getComponentName = (
  stackFrames: SelectionStackFrame[],
): string | null => {
  for (const stackFrame of stackFrames) {
    if (
      stackFrame.fileName &&
      isProjectSourceFrame(stackFrame.fileName) &&
      isSourceComponentName(stackFrame.functionName)
    ) {
      return stackFrame.functionName;
    }
  }

  for (const stackFrame of stackFrames) {
    if (isUsefulComponentName(stackFrame.functionName)) {
      return stackFrame.functionName;
    }
  }

  return null;
};

export const buildSelectionContextForElement = async (
  selectedElement: Element,
): Promise<SelectionContext> => {
  const nearestFiberElement = findNearestFiberElement(selectedElement);
  const stackFrames = nearestFiberElement
    ? await buildStackFrames(nearestFiberElement)
    : [];
  const componentName =
    getComponentDisplayName(selectedElement) || getComponentName(stackFrames);
  const resolvedSources = resolveSourceFrames(stackFrames, componentName);
  const selectionContext = {
    domPreview: getDomPreview(selectedElement),
    sourcePreview: null,
    selector: createElementSelector(selectedElement),
    componentName,
    stackFrames,
    resolvedSources,
    sourceSnippets: [],
    capturedAt: Date.now(),
  };

  return {
    ...selectionContext,
    sourcePreview: buildSelectionSourcePreview(selectionContext),
  };
};
