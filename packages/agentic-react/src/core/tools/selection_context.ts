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
  SelectionExternalComponent,
  SelectionResolvedSource,
  SelectionSourceTraceFrame,
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
  'Styled(',
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
const NODE_MODULES_PATTERN = /(?:^|[/\\])node_modules[/\\]/g;
const VITE_OPTIMIZED_DEPS_PATTERN = /[/\\]\.vite[/\\]deps[^/\\]*[/\\]/g;
const FILE_EXTENSION_PATTERN = /\.[mc]?[jt]sx?$/i;
const VITE_INTERNAL_CHUNK_PATTERN = /^chunk-[A-Za-z0-9_-]+$/;
const PATH_SEPARATOR_PATTERN = /[/\\]/;
const NAME_AT_VERSION_PATTERN = /^(.+?)@v?\d/;
const INTRINSIC_ELEMENT_NAMES = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'search',
  'section',
  'select',
  'slot',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
]);

const isIntrinsicElementName = (name: string | null): boolean =>
  Boolean(name && INTRINSIC_ELEMENT_NAMES.has(name));

const isUsefulComponentName = (name: string | null): boolean => {
  if (!name) return false;
  if (isIntrinsicElementName(name)) return false;
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

const safeDecodeUriComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return value;
  }
};

const splitPathSegments = (path: string): string[] =>
  path.split(PATH_SEPARATOR_PATTERN).filter(Boolean);

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

const isExternalSourceFrame = (fileName: string): boolean => {
  const normalizedFileName = normalizeSourceFilePath(fileName);
  const pathSegments = normalizedFileName.split('/').filter(Boolean);
  const looksLikeJavaScriptSource = /\.(?:[cm]?js|jsx?|tsx?)$/i.test(
    normalizedFileName,
  );

  if (!looksLikeJavaScriptSource) {
    return false;
  }

  return (
    pathSegments.includes('node_modules') ||
    pathSegments.includes('.vite') ||
    normalizedFileName.includes('/@vite/')
  );
};

const normalizeDisplayComponentName = (name: string | null): string | null => {
  if (!name) return null;
  const memoMatch = name.match(/^Memo\((.+)\)$/);
  if (memoMatch) return memoMatch[1];
  const forwardRefMatch = name.match(/^ForwardRef\((.+)\)$/);
  if (forwardRefMatch) return forwardRefMatch[1];
  return name;
};

const extractPackageNameFromFilePath = (filePath: string): string | null => {
  const readNodeModulesPackage = (afterMarker: string): string | null => {
    const [firstSegment, secondSegment] = splitPathSegments(afterMarker);
    if (!firstSegment || firstSegment.startsWith('.')) return null;
    if (!firstSegment.startsWith('@')) return firstSegment;
    return secondSegment ? `${firstSegment}/${secondSegment}` : null;
  };

  const readViteOptimizedDependencyPackage = (
    afterMarker: string,
  ): string | null => {
    const firstSegment = splitPathSegments(afterMarker)[0];
    if (!firstSegment) return null;

    const packageStem = firstSegment.replace(FILE_EXTENSION_PATTERN, '');
    if (VITE_INTERNAL_CHUNK_PATTERN.test(packageStem)) return null;
    if (!packageStem.startsWith('@')) return packageStem;

    const scopeBoundaryIndex = packageStem.indexOf('_');
    if (scopeBoundaryIndex === -1) return null;
    return `${packageStem.slice(0, scopeBoundaryIndex)}/${packageStem.slice(
      scopeBoundaryIndex + 1,
    )}`;
  };

  const extractAfterLastMarker = (
    input: string,
    pattern: RegExp,
    read: (afterMarker: string) => string | null,
  ): string | null => {
    pattern.lastIndex = 0;
    let lastMatch: RegExpExecArray | null = null;
    let match = pattern.exec(input);
    while (match !== null) {
      lastMatch = match;
      match = pattern.exec(input);
    }
    pattern.lastIndex = 0;
    if (!lastMatch) return null;
    return read(input.slice(lastMatch.index + lastMatch[0].length));
  };

  const extractNameAtVersion = (segment: string | undefined): string | null =>
    segment?.match(NAME_AT_VERSION_PATTERN)?.[1] ?? null;

  const extractVersionedPackageFromUrl = (
    rawFilePath: string,
  ): string | null => {
    let url: URL;
    try {
      url = new URL(rawFilePath);
    } catch (_error) {
      return null;
    }

    const segments = splitPathSegments(url.pathname).map(
      safeDecodeUriComponent,
    );
    for (const [index, segment] of segments.entries()) {
      if (segment.startsWith('@')) {
        const name = extractNameAtVersion(segments[index + 1]);
        if (name) return `${segment}/${name}`;
        continue;
      }

      const name = extractNameAtVersion(segment);
      if (name) return name;
    }
    return null;
  };

  const normalizedFileName = normalizeSourceFilePath(filePath);
  const decodedFileName = safeDecodeUriComponent(normalizedFileName);

  const vitePackage = extractAfterLastMarker(
    decodedFileName,
    VITE_OPTIMIZED_DEPS_PATTERN,
    readViteOptimizedDependencyPackage,
  );
  if (vitePackage) {
    return vitePackage;
  }

  const nodeModulesPackage = extractAfterLastMarker(
    decodedFileName,
    NODE_MODULES_PATTERN,
    readNodeModulesPackage,
  );
  if (nodeModulesPackage) {
    return nodeModulesPackage;
  }

  return extractVersionedPackageFromUrl(filePath);
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

export const getSelectionElementComponentName = (
  element: Element,
): string | null => {
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

const getFiberComponentRankByName = (element: Element): Map<string, number> => {
  const rankByName = new Map<string, number>();
  if (!isInstrumentationActive()) return rankByName;

  const resolvedElement = findNearestFiberElement(element);
  if (!resolvedElement) return rankByName;
  const fiber = getFiberFromHostInstance(resolvedElement);
  if (!fiber) return rankByName;

  let currentFiber = fiber.return;
  let rank = 0;
  while (currentFiber) {
    if (isCompositeFiber(currentFiber)) {
      const name = normalizeDisplayComponentName(
        getDisplayName(currentFiber.type),
      );
      if (name && !rankByName.has(name)) {
        rankByName.set(name, rank);
      }
      rank += 1;
    }
    currentFiber = currentFiber.return;
  }

  return rankByName;
};

const stackFrameCache = new WeakMap<Element, Promise<SelectionStackFrame[]>>();

const buildStackFramesForElement = async (
  nearestFiberElement: Element,
): Promise<SelectionStackFrame[]> => {
  const fiber = getFiberFromHostInstance(nearestFiberElement);
  if (!fiber) {
    return [];
  }

  const buildFiberStackFrames = async (): Promise<SelectionStackFrame[]> => {
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
  };

  try {
    const ownerStack = checkIsNextProject()
      ? await symbolicateServerFrames(
          enrichServerFrameLocations(fiber, await getOwnerStack(fiber)),
        )
      : await getOwnerStack(fiber);
    const ownerStackFrames = ownerStack
      .slice(0, MAX_STACK_FRAMES)
      .map(mapOwnerStackFrame);
    const fiberStackFrames = await buildFiberStackFrames();
    const unresolvedOwnerFrameNames = new Set(
      ownerStackFrames
        .filter((stackFrame) => !stackFrame.fileName && stackFrame.functionName)
        .map((stackFrame) => stackFrame.functionName as string),
    );
    const seenFrameKeys = new Set(
      ownerStackFrames.map(
        (stackFrame) =>
          `${stackFrame.functionName ?? ''}:${stackFrame.fileName ?? ''}:${stackFrame.lineNumber ?? ''}:${stackFrame.columnNumber ?? ''}`,
      ),
    );
    const supplementalFiberFrames = fiberStackFrames.filter((stackFrame) => {
      if (
        stackFrame.fileName &&
        isExternalSourceFrame(stackFrame.fileName) &&
        stackFrame.functionName &&
        unresolvedOwnerFrameNames.has(stackFrame.functionName)
      ) {
        return false;
      }

      const frameKey = `${stackFrame.functionName ?? ''}:${stackFrame.fileName ?? ''}:${stackFrame.lineNumber ?? ''}:${stackFrame.columnNumber ?? ''}`;
      if (seenFrameKeys.has(frameKey)) {
        return false;
      }
      seenFrameKeys.add(frameKey);
      return true;
    });

    return [...ownerStackFrames, ...supplementalFiberFrames].slice(
      0,
      MAX_STACK_FRAMES,
    );
  } catch (_error) {
    return buildFiberStackFrames();
  }
};

const buildStackFrames = (
  nearestFiberElement: Element,
): Promise<SelectionStackFrame[]> => {
  const cachedStackFrames = stackFrameCache.get(nearestFiberElement);
  if (cachedStackFrames) {
    return cachedStackFrames;
  }

  const stackFrames = buildStackFramesForElement(nearestFiberElement);
  stackFrameCache.set(nearestFiberElement, stackFrames);
  return stackFrames;
};

const resolveSourceFrames = (
  stackFrames: SelectionStackFrame[],
  preferredComponentName: string | null,
  componentRankByName: Map<string, number>,
): SelectionResolvedSource[] => {
  const resolvedSources: SelectionResolvedSource[] = [];
  const seenSourceKeys = new Set<string>();
  const sourceFrames = stackFrames.filter(
    (stackFrame) =>
      stackFrame.fileName && isProjectSourceFrame(stackFrame.fileName),
  );

  const getFrameComponentName = (stackFrame: SelectionStackFrame) =>
    stackFrame.fileName
      ? inferComponentNameFromSource(
          stackFrame.fileName,
          stackFrame.functionName,
        )
      : null;

  const getFiberRank = (stackFrame: SelectionStackFrame): number => {
    const componentName = getFrameComponentName(stackFrame);
    if (!componentName) return Number.POSITIVE_INFINITY;
    return componentRankByName.get(componentName) ?? Number.POSITIVE_INFINITY;
  };

  const sortedSourceFrames = [...sourceFrames].sort((left, right) => {
    const leftRank = getFiberRank(left);
    const rightRank = getFiberRank(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftComponentName = getFrameComponentName(left);
    const rightComponentName = getFrameComponentName(right);
    const leftIsPreferred = leftComponentName === preferredComponentName;
    const rightIsPreferred = rightComponentName === preferredComponentName;
    if (leftIsPreferred !== rightIsPreferred) {
      return leftIsPreferred ? -1 : 1;
    }

    const leftIsSourceComponent = isSourceComponentName(left.functionName);
    const rightIsSourceComponent = isSourceComponentName(right.functionName);
    if (leftIsSourceComponent !== rightIsSourceComponent) {
      return leftIsSourceComponent ? -1 : 1;
    }

    return 0;
  });

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

const resolveExternalComponent = (
  stackFrames: SelectionStackFrame[],
  selectedComponentName: string | null,
  resolvedSources: SelectionResolvedSource[],
): SelectionExternalComponent | null => {
  const selectedDisplayName = normalizeDisplayComponentName(
    selectedComponentName,
  );
  if (!selectedDisplayName) {
    return null;
  }

  const externalFrames = stackFrames.filter(
    (stackFrame) =>
      stackFrame.fileName &&
      isExternalSourceFrame(stackFrame.fileName) &&
      isUsefulComponentName(stackFrame.functionName),
  );
  if (externalFrames.length === 0) {
    return null;
  }

  const selectedExternalFrame = externalFrames.find(
    (stackFrame) =>
      normalizeDisplayComponentName(stackFrame.functionName) ===
      selectedDisplayName,
  );
  if (!selectedExternalFrame?.fileName) {
    return null;
  }

  return {
    componentName:
      normalizeDisplayComponentName(selectedExternalFrame.functionName) ||
      selectedDisplayName,
    packageName: extractPackageNameFromFilePath(selectedExternalFrame.fileName),
    filePath: normalizeSourceFilePath(selectedExternalFrame.fileName),
    usedBy: resolvedSources[0] ?? null,
  };
};

const formatTraceFrameKey = (
  frame: Pick<
    SelectionSourceTraceFrame,
    'kind' | 'componentName' | 'filePath' | 'lineNumber' | 'columnNumber'
  >,
): string =>
  `${frame.kind}:${frame.componentName ?? ''}:${frame.filePath}:${frame.lineNumber ?? ''}:${frame.columnNumber ?? ''}`;

const mapStackFrameToTraceFrame = (
  stackFrame: SelectionStackFrame,
): SelectionSourceTraceFrame | null => {
  if (!stackFrame.fileName) return null;

  if (isExternalSourceFrame(stackFrame.fileName)) {
    return {
      kind: 'external',
      componentName:
        normalizeDisplayComponentName(stackFrame.functionName) ?? null,
      packageName: extractPackageNameFromFilePath(stackFrame.fileName),
      filePath: normalizeSourceFilePath(stackFrame.fileName),
      lineNumber: stackFrame.lineNumber,
      columnNumber: stackFrame.columnNumber,
    };
  }

  if (!isProjectSourceFrame(stackFrame.fileName)) {
    return null;
  }

  const filePath = normalizeSourceFilePath(stackFrame.fileName);
  return {
    kind: 'project',
    componentName: inferComponentNameFromSource(
      filePath,
      stackFrame.functionName,
    ),
    packageName: null,
    filePath,
    lineNumber: stackFrame.lineNumber,
    columnNumber: stackFrame.columnNumber,
  };
};

const buildSourceTrace = (
  stackFrames: SelectionStackFrame[],
  resolvedSources: SelectionResolvedSource[],
): SelectionSourceTraceFrame[] => {
  const traceFrames: SelectionSourceTraceFrame[] = [];
  const seenTraceFrameKeys = new Set<string>();
  let previousExternalPackageName: string | null = null;

  const addTraceFrame = (frame: SelectionSourceTraceFrame | null) => {
    if (!frame?.filePath) return;

    if (
      frame.kind === 'external' &&
      frame.packageName &&
      frame.packageName === previousExternalPackageName
    ) {
      return;
    }

    const traceFrameKey = formatTraceFrameKey(frame);
    if (seenTraceFrameKeys.has(traceFrameKey)) return;

    seenTraceFrameKeys.add(traceFrameKey);
    traceFrames.push(frame);
    previousExternalPackageName =
      frame.kind === 'external' ? frame.packageName : null;
  };

  for (const stackFrame of stackFrames) {
    addTraceFrame(mapStackFrameToTraceFrame(stackFrame));
    if (traceFrames.length >= MAX_SOURCE_FRAMES) {
      break;
    }
  }

  const hasProjectFrame = traceFrames.some(
    (traceFrame) => traceFrame.kind === 'project',
  );

  if (!hasProjectFrame) {
    for (const resolvedSource of resolvedSources) {
      addTraceFrame({
        kind: 'project',
        componentName: resolvedSource.componentName,
        packageName: null,
        filePath: resolvedSource.filePath,
        lineNumber: resolvedSource.lineNumber,
        columnNumber: resolvedSource.columnNumber,
      });
      if (traceFrames.length >= MAX_SOURCE_FRAMES) {
        break;
      }
    }
  }

  return traceFrames;
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
  const componentRankByName = getFiberComponentRankByName(selectedElement);
  const displayComponentName =
    getSelectionElementComponentName(selectedElement);
  const stackComponentName = getComponentName(stackFrames);
  const fallbackComponentName = stackComponentName || displayComponentName;
  const resolvedSources = resolveSourceFrames(
    stackFrames,
    fallbackComponentName,
    componentRankByName,
  );
  const sourceComponentName =
    resolvedSources.find((source) => source.componentName)?.componentName ??
    null;
  const componentName =
    sourceComponentName || stackComponentName || displayComponentName;
  const externalComponent = resolveExternalComponent(
    stackFrames,
    componentName,
    resolvedSources,
  );
  const sourceTrace = buildSourceTrace(stackFrames, resolvedSources);
  const selectionContext = {
    domPreview: getDomPreview(selectedElement),
    sourcePreview: null,
    selector: createElementSelector(selectedElement),
    componentName,
    externalComponent,
    stackFrames,
    resolvedSources,
    sourceTrace,
    sourceSnippets: [],
    capturedAt: Date.now(),
  };

  return {
    ...selectionContext,
    sourcePreview: buildSelectionSourcePreview(selectionContext),
  };
};
