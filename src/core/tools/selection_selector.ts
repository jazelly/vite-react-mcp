const FINDER_TIMEOUT_MS = 200;
const MAX_SELECTOR_COMBINATIONS = 10000;
const SELECTOR_ATTR_VALUE_MAX_LENGTH_CHARS = 120;

interface SelectorNode {
  name: string;
  penalty: number;
}

const PREFERRED_SELECTOR_ATTRIBUTE_NAMES = new Set([
  'data-testid',
  'data-test-id',
  'data-test',
  'data-cy',
  'data-qa',
  'aria-label',
  'role',
  'name',
  'title',
  'alt',
]);

const ACCEPTED_ATTR_NAMES = new Set([
  'role',
  'name',
  'aria-label',
  'rel',
  'href',
]);

const escapeCssIdentifier = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
};

const isWordLike = (text: string): boolean => {
  if (!/^[a-z\-]{3,}$/i.test(text)) return false;
  const segments = text.split(/-|[A-Z]/);
  for (const segment of segments) {
    if (segment.length <= 2) return false;
    if (/[^aeiou]{4,}/i.test(segment)) return false;
  }
  return true;
};

const isPreferredAttributeValueSafe = (value: string): boolean =>
  value.length > 0 && value.length <= SELECTOR_ATTR_VALUE_MAX_LENGTH_CHARS;

const isAcceptedAttr = (
  attributeName: string,
  attributeValue: string,
): boolean => {
  const nameIsAccepted =
    ACCEPTED_ATTR_NAMES.has(attributeName) ||
    (attributeName.startsWith('data-') && isWordLike(attributeName));
  const valueIsAccepted =
    (isWordLike(attributeValue) &&
      attributeValue.length < SELECTOR_ATTR_VALUE_MAX_LENGTH_CHARS) ||
    (attributeValue.startsWith('#') && isWordLike(attributeValue.slice(1)));
  return nameIsAccepted && valueIsAccepted;
};

const getFinderRoot = (element: Element): Element =>
  element.ownerDocument.body ?? element.ownerDocument.documentElement;

const isSelectorUniqueForElement = (
  element: Element,
  selector: string,
): boolean => {
  try {
    const matchingElements = element.ownerDocument.querySelectorAll(selector);
    return matchingElements.length === 1 && matchingElements[0] === element;
  } catch (_error) {
    return false;
  }
};

const createFastElementSelector = (element: Element): string | null => {
  if (element instanceof HTMLElement && element.id) {
    const idSelector = `#${escapeCssIdentifier(element.id)}`;
    if (isSelectorUniqueForElement(element, idSelector)) return idSelector;
  }

  for (const attributeName of PREFERRED_SELECTOR_ATTRIBUTE_NAMES) {
    const attributeValue = element.getAttribute(attributeName);
    if (!attributeValue) continue;
    if (!isPreferredAttributeValueSafe(attributeValue)) continue;

    const quotedValue = JSON.stringify(attributeValue);
    const attributeOnlySelector = `[${attributeName}=${quotedValue}]`;
    if (isSelectorUniqueForElement(element, attributeOnlySelector)) {
      return attributeOnlySelector;
    }

    const tagSelector = `${element.tagName.toLowerCase()}${attributeOnlySelector}`;
    if (isSelectorUniqueForElement(element, tagSelector)) {
      return tagSelector;
    }
  }

  return null;
};

const getChildIndex = (
  element: Element,
  filterTagName?: string,
): number | undefined => {
  const parentNode = element.parentNode;
  if (!parentNode) return undefined;

  let sibling = parentNode.firstChild;
  if (!sibling) return undefined;

  let position = 0;
  while (sibling) {
    if (
      sibling.nodeType === Node.ELEMENT_NODE &&
      (filterTagName === undefined ||
        (sibling as Element).tagName.toLowerCase() === filterTagName)
    ) {
      position++;
    }
    if (sibling === element) break;
    sibling = sibling.nextSibling;
  }
  return position;
};

const formatNthChild = (tagName: string, childPosition: number): string =>
  tagName === 'html' ? 'html' : `${tagName}:nth-child(${childPosition})`;

const formatNthOfType = (tagName: string, typePosition: number): string =>
  tagName === 'html' ? 'html' : `${tagName}:nth-of-type(${typePosition})`;

const collectCandidateNodes = (element: Element): SelectorNode[] => {
  const candidates: SelectorNode[] = [];
  const elementId = element.getAttribute('id');
  const elementTagName = element.tagName.toLowerCase();

  if (elementId && isWordLike(elementId)) {
    candidates.push({
      name: `#${escapeCssIdentifier(elementId)}`,
      penalty: 0,
    });
  }

  for (const className of Array.from(element.classList)) {
    if (isWordLike(className)) {
      candidates.push({
        name: `.${escapeCssIdentifier(className)}`,
        penalty: 1,
      });
    }
  }

  for (const attribute of Array.from(element.attributes)) {
    if (isAcceptedAttr(attribute.name, attribute.value)) {
      candidates.push({
        name: `[${escapeCssIdentifier(attribute.name)}="${escapeCssIdentifier(attribute.value)}"]`,
        penalty: 2,
      });
    }
  }

  candidates.push({ name: elementTagName, penalty: 5 });

  const typePosition = getChildIndex(element, elementTagName);
  if (typePosition !== undefined) {
    candidates.push({
      name: formatNthOfType(elementTagName, typePosition),
      penalty: 10,
    });
  }

  const childPosition = getChildIndex(element);
  if (childPosition !== undefined) {
    candidates.push({
      name: formatNthChild(elementTagName, childPosition),
      penalty: 50,
    });
  }

  return candidates;
};

const buildSelectorString = (path: SelectorNode[]): string => {
  let result = path[0].name;
  for (let index = 1; index < path.length; index++) {
    result = `${path[index].name} > ${result}`;
  }
  return result;
};

const collectCombinations = (
  stack: SelectorNode[][],
  budget = MAX_SELECTOR_COMBINATIONS,
  currentPath: SelectorNode[] = [],
): SelectorNode[][] => {
  if (budget <= 0) return [];
  if (stack.length === 0) return [currentPath];

  const results: SelectorNode[][] = [];
  for (const selectorNode of stack[0]) {
    const remainingBudget = budget - results.length;
    if (remainingBudget <= 0) break;
    results.push(
      ...collectCombinations(stack.slice(1), remainingBudget, [
        ...currentPath,
        selectorNode,
      ]),
    );
  }
  return results;
};

const calculatePenalty = (path: SelectorNode[]): number =>
  path.reduce((total, selectorNode) => total + selectorNode.penalty, 0);

const comparePenalty = (pathA: SelectorNode[], pathB: SelectorNode[]): number =>
  calculatePenalty(pathA) - calculatePenalty(pathB);

const resolveRootDocument = (
  rootNode: Element | Document,
  targetElement: Element,
): Element | Document => {
  const attachedRoot = targetElement.getRootNode?.();
  if (attachedRoot instanceof ShadowRoot) {
    return attachedRoot as unknown as Document;
  }
  if (rootNode.nodeType === Node.DOCUMENT_NODE) return rootNode;
  return (rootNode as Element).ownerDocument;
};

const isSelectorUnique = (
  selectorPath: SelectorNode[],
  rootDocument: Element | Document,
): boolean =>
  rootDocument.querySelectorAll(buildSelectorString(selectorPath)).length === 1;

const buildFallbackPath = (
  targetElement: Element,
  rootDocument: Element | Document,
): SelectorNode[] | undefined => {
  let currentElement: Element | null = targetElement;
  const path: SelectorNode[] = [];

  while (currentElement && currentElement !== rootDocument) {
    const currentTagName = currentElement.tagName.toLowerCase();
    const typePosition = getChildIndex(currentElement, currentTagName);
    if (typePosition === undefined) return undefined;

    path.push({
      name: formatNthOfType(currentTagName, typePosition),
      penalty: 10,
    });
    currentElement = currentElement.parentElement;
  }

  return isSelectorUnique(path, rootDocument) ? path : undefined;
};

const findUniqueSelector = (
  targetElement: Element,
  root: Element | Document,
): string | null => {
  if (targetElement.nodeType !== Node.ELEMENT_NODE) return null;
  if (targetElement.tagName.toLowerCase() === 'html') return 'html';

  const rootDocument = resolveRootDocument(root, targetElement);
  const startTime = Date.now();
  const ancestorStack: SelectorNode[][] = [];
  let currentElement: Element | null = targetElement;
  let depth = 0;
  let foundPath: SelectorNode[] | undefined;

  while (currentElement && currentElement !== rootDocument && !foundPath) {
    ancestorStack.push(collectCandidateNodes(currentElement));
    currentElement = currentElement.parentElement;
    depth++;

    if (depth >= 3) {
      const candidatePaths = collectCombinations(ancestorStack);
      candidatePaths.sort(comparePenalty);

      for (const candidatePath of candidatePaths) {
        if (Date.now() - startTime > FINDER_TIMEOUT_MS) {
          const fallbackPath = buildFallbackPath(targetElement, rootDocument);
          return fallbackPath ? buildSelectorString(fallbackPath) : null;
        }
        if (isSelectorUnique(candidatePath, rootDocument)) {
          foundPath = candidatePath;
          break;
        }
      }
    }
  }

  if (!foundPath && depth < 3) {
    const remainingPaths = collectCombinations(ancestorStack);
    remainingPaths.sort(comparePenalty);
    for (const candidatePath of remainingPaths) {
      if (Date.now() - startTime > FINDER_TIMEOUT_MS) break;
      if (isSelectorUnique(candidatePath, rootDocument)) {
        foundPath = candidatePath;
        break;
      }
    }
  }

  return foundPath ? buildSelectorString(foundPath) : null;
};

const createNthChildSelector = (element: Element): string => {
  const segments: string[] = [];
  const root = getFinderRoot(element);
  let currentElement: Element | null = element;

  while (currentElement) {
    if (currentElement instanceof HTMLElement && currentElement.id) {
      segments.unshift(`#${escapeCssIdentifier(currentElement.id)}`);
      break;
    }

    const parentElement = currentElement.parentElement;
    if (!parentElement) {
      segments.unshift(currentElement.tagName.toLowerCase());
      break;
    }

    const siblings = Array.from(parentElement.children);
    const siblingIndex = siblings.indexOf(currentElement);
    const nthChild = siblingIndex >= 0 ? siblingIndex + 1 : 1;
    segments.unshift(
      `${currentElement.tagName.toLowerCase()}:nth-child(${nthChild})`,
    );

    if (parentElement === root) {
      segments.unshift(root.tagName.toLowerCase());
      break;
    }

    currentElement = parentElement;
  }

  return segments.join(' > ');
};

export const createElementSelector = (element: Element): string => {
  const fastSelector = createFastElementSelector(element);
  if (fastSelector) return fastSelector;

  try {
    const selector = findUniqueSelector(element, getFinderRoot(element));
    if (selector) return selector;
  } catch (_error) {
    // Unusual DOMs can throw while querying selectors. The nth-child path is slower
    // to read, but deterministic and still points back to the selected element.
  }

  return createNthChildSelector(element);
};
