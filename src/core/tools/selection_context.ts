import { getFiberFromHostInstance, getFiberStack } from 'bippy';
import {
  type StackFrame,
  getOwnerStack,
  getSource,
  isSourceFile,
  normalizeFileName,
} from 'bippy/source';
import type {
  SelectionContext,
  SelectionResolvedSource,
  SelectionStackFrame,
} from '../../shared/types.js';
import { getDisplayNameForFiber } from '../../shared/util.js';

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
]);

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

const normalizeSourceFilePath = (fileName: string): string => {
  const normalizedFileName = normalizeFileName(fileName);
  return normalizedFileName.replace(/\?.*$/, '');
};

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

const buildSelectorSegment = (element: Element): string => {
  const tagName = element.tagName.toLowerCase();
  if (element.id) {
    return `${tagName}#${element.id}`;
  }

  const classes = Array.from(element.classList)
    .slice(0, 2)
    .map((name) => name.trim())
    .filter(Boolean);

  if (classes.length > 0) {
    return `${tagName}.${classes.join('.')}`;
  }

  const parentElement = element.parentElement;
  if (!parentElement) {
    return tagName;
  }

  const sameTagSiblings = Array.from(parentElement.children).filter(
    (siblingElement) => siblingElement.tagName === element.tagName,
  );

  if (sameTagSiblings.length <= 1) {
    return tagName;
  }

  const position = sameTagSiblings.indexOf(element) + 1;
  return `${tagName}:nth-of-type(${position})`;
};

const createElementSelector = (element: Element): string => {
  const selectorSegments: string[] = [];
  let currentElement: Element | null = element;

  while (currentElement && selectorSegments.length < 5) {
    selectorSegments.unshift(buildSelectorSegment(currentElement));
    if (currentElement.id) {
      break;
    }
    currentElement = currentElement.parentElement;
  }

  return selectorSegments.join(' > ');
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

const buildStackFrames = async (
  nearestFiberElement: Element,
): Promise<SelectionStackFrame[]> => {
  const fiber = getFiberFromHostInstance(nearestFiberElement);
  if (!fiber) {
    return [];
  }

  try {
    const ownerStack = await getOwnerStack(fiber);
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
): SelectionResolvedSource[] => {
  const resolvedSources: SelectionResolvedSource[] = [];
  const seenSourceKeys = new Set<string>();

  for (const stackFrame of stackFrames) {
    if (!stackFrame.fileName || !isSourceFile(stackFrame.fileName)) {
      continue;
    }

    const sourceKey = `${stackFrame.fileName}:${stackFrame.lineNumber ?? 0}:${stackFrame.columnNumber ?? 0}`;
    if (seenSourceKeys.has(sourceKey)) {
      continue;
    }

    seenSourceKeys.add(sourceKey);
    resolvedSources.push({
      filePath: stackFrame.fileName,
      lineNumber: stackFrame.lineNumber,
      columnNumber: stackFrame.columnNumber,
      componentName: stackFrame.functionName,
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
    if (isSourceComponentName(stackFrame.functionName)) {
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

  return {
    domPreview: getDomPreview(selectedElement),
    selector: createElementSelector(selectedElement),
    componentName: getComponentName(stackFrames),
    stackFrames,
    resolvedSources: resolveSourceFrames(stackFrames),
    sourceSnippets: [],
    capturedAt: Date.now(),
  };
};
