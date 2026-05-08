const VIEWPORT_COVERAGE_THRESHOLD = 0.9;
const OVERLAY_Z_INDEX_THRESHOLD = 1000;
const DEV_TOOLS_OVERLAY_Z_INDEX_THRESHOLD = 2147483600;
const ELEMENT_POSITION_CACHE_DISTANCE_THRESHOLD_PX = 2;
const ELEMENT_POSITION_THROTTLE_MS = 16;

interface PositionCache {
  clientX: number;
  clientY: number;
  element: Element | null;
  timestamp: number;
}

let cache: PositionCache | null = null;

const isRootElement = (element: Element): boolean => {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'html' || tagName === 'body';
};

const hasTransparentBackground = (
  computedStyle: CSSStyleDeclaration,
): boolean => {
  const backgroundColor = computedStyle.backgroundColor;
  return (
    backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)'
  );
};

const isDevToolsOverlay = (computedStyle: CSSStyleDeclaration): boolean => {
  const zIndex = Number.parseInt(computedStyle.zIndex, 10);
  return (
    computedStyle.pointerEvents === 'none' &&
    computedStyle.position === 'fixed' &&
    !Number.isNaN(zIndex) &&
    zIndex >= DEV_TOOLS_OVERLAY_Z_INDEX_THRESHOLD
  );
};

const isFullViewportOverlay = (
  element: Element,
  computedStyle: CSSStyleDeclaration,
): boolean => {
  const position = computedStyle.position;
  if (position !== 'fixed' && position !== 'absolute') return false;

  const coversViewport =
    element.clientWidth / window.innerWidth >= VIEWPORT_COVERAGE_THRESHOLD &&
    element.clientHeight / window.innerHeight >= VIEWPORT_COVERAGE_THRESHOLD;
  if (!coversViewport) return false;

  if (hasTransparentBackground(computedStyle)) return true;
  if (Number.parseFloat(computedStyle.opacity) < 0.1) return true;

  const zIndex = Number.parseInt(computedStyle.zIndex, 10);
  return !Number.isNaN(zIndex) && zIndex > OVERLAY_Z_INDEX_THRESHOLD;
};

const isVisibleElement = (
  element: Element,
  computedStyle: CSSStyleDeclaration,
): boolean =>
  computedStyle.display !== 'none' &&
  computedStyle.visibility !== 'hidden' &&
  computedStyle.opacity !== '0' &&
  element.getClientRects().length > 0;

const isWithinThreshold = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean =>
  Math.abs(x1 - x2) <= ELEMENT_POSITION_CACHE_DISTANCE_THRESHOLD_PX &&
  Math.abs(y1 - y2) <= ELEMENT_POSITION_CACHE_DISTANCE_THRESHOLD_PX;

export const isSelectableElement = (
  element: Element,
  isOverlayElement: (element: Element) => boolean,
): boolean => {
  if (isRootElement(element)) return false;
  if (isOverlayElement(element)) return false;

  const computedStyle = window.getComputedStyle(element);
  if (!isVisibleElement(element, computedStyle)) return false;
  if (isDevToolsOverlay(computedStyle)) return false;
  if (isFullViewportOverlay(element, computedStyle)) return false;

  return true;
};

export const getSelectableElementAtPosition = (
  clientX: number,
  clientY: number,
  isOverlayElement: (element: Element) => boolean,
): Element | null => {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;

  const now = performance.now();
  if (cache) {
    const isPositionClose = isWithinThreshold(
      clientX,
      clientY,
      cache.clientX,
      cache.clientY,
    );
    const isWithinThrottle =
      now - cache.timestamp < ELEMENT_POSITION_THROTTLE_MS;

    if (isPositionClose || isWithinThrottle) {
      return cache.element;
    }
  }

  let result: Element | null = null;
  const topElement = document.elementFromPoint(clientX, clientY);
  if (topElement && isSelectableElement(topElement, isOverlayElement)) {
    result = topElement;
  } else {
    const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
    for (const candidateElement of elementsAtPoint) {
      if (
        candidateElement !== topElement &&
        isSelectableElement(candidateElement, isOverlayElement)
      ) {
        result = candidateElement;
        break;
      }
    }
  }

  cache = { clientX, clientY, element: result, timestamp: now };
  return result;
};

export const clearSelectableElementCache = (): void => {
  cache = null;
};
