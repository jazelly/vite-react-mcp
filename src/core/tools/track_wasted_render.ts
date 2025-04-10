import {
  getDisplayName,
  getDisplayNameForFiber,
  isReactElement,
} from '../../shared/util';
import {
  traverseProps,
  isHostFiber,
  type Fiber,
  isCompositeFiber,
  didFiberCommit,
  getMutatedHostFibers,
  shouldFilterFiber,
} from 'bippy';
import { store, wastedRenderFiberInfo } from '../../shared/store';

const stringifyValueExceptObject = (value: any): string | null => {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'function':
      return value.toString();
    case 'string':
      return value;
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'object':
      break;
    default:
      return String(value);
  }

  return null;
};

// https://github.com/aidenybai/react-scan/blob/main/packages/scan/src/core/instrumentation.ts#L127
export function stringifyValue(value: any): string {
  const valueString = stringifyValueExceptObject(value);
  if (valueString !== null) {
    return valueString;
  }

  if (Array.isArray(value)) {
    return value.length ? `[${value.length}]` : '[]';
  }

  if (isReactElement(value)) {
    const type = getDisplayName(value.type) ?? '';
    const propCount = value.props ? Object.keys(value.props).length : 0;
    return `<${type} ${propCount}>`;
  }

  if (Object.getPrototypeOf(value) === Object.prototype) {
    const keys = Object.keys(value);
    return keys.length ? `{${keys.length}}` : '{}';
  }

  const ctor =
    value && typeof value === 'object' ? value.constructor : undefined;
  if (ctor && typeof ctor === 'function' && ctor.name) {
    return `${ctor.name}{…}`;
  }

  // in case value.toString() is overriden
  // tag is like [object Object]
  const tagString = Object.prototype.toString.call(value).slice(8, -1);
  return `${tagString}{…}`;
}

export const isPropChangeNecessary = (
  prevPropValue: unknown,
  currentPropValue: unknown,
) => {
  // there are two cases where a prop change is wasted during a rerender
  // 1. the prop ref is not changed
  // 2. even when ref is changed, but due to re-instantiating, e.g. function in functional component
  if (prevPropValue === currentPropValue) return false;
  if (
    stringifyValue(prevPropValue) === stringifyValue(currentPropValue) &&
    (typeof prevPropValue === 'function' ||
      typeof prevPropValue === 'object') &&
    (typeof currentPropValue === 'function' ||
      typeof currentPropValue === 'object')
  ) {
    return false;
  }
  // Any other cases are necessary
  return true;
};

export const isRenderNecessary = (fiber: Fiber): boolean => {
  if (!didFiberCommit(fiber)) return false;

  const rerenderedHostFibers = getMutatedHostFibers(fiber);
  let necessaryChange = true;
  for (const rerenderedHostFiber of rerenderedHostFibers) {
    traverseProps(
      rerenderedHostFiber,
      (_propsName: string, prevValue: unknown, nextValue: unknown) => {
        if (!isPropChangeNecessary(prevValue, nextValue)) {
          necessaryChange = false;
          // found unnecessary change, no need to check other fiber's props
          return !necessaryChange;
        }
      },
    );
  }
  return necessaryChange;
};

// onCommitFiberRoot calls this
// Collect if the fiber is
// 1. compositeFiber
// 2. !isRenderNecessary
export const collectUnnecessaryRender = (fiber: Fiber) => {
  // this should only be called when fiber is updating
  // mounting or unmounting of a fiber is not considered as wasted render
  if (
    isCompositeFiber(fiber) &&
    !shouldFilterFiber(fiber) &&
    !isRenderNecessary(fiber)
  ) {
    const name = getDisplayNameForFiber(fiber);
    const collectedAt = Date.now();
    const commitId = store.currentCommitFrameId;
    wastedRenderFiberInfo.set(name, {
      name,
      collectedAt,
      commitId,
    });
  }
};

export const queryWastedRender = (start: number, end: number = Date.now()) => {
  const result = [];
  for (const wastedRender of wastedRenderFiberInfo.values()) {
    if (wastedRender.collectedAt >= start && wastedRender.collectedAt <= end) {
      result.push(wastedRender);
    }
  }

  result.sort((a, b) => a.collectedAt - b.collectedAt);
  console.log('result', result);
  console.log('result[0]', new Date(result[0].collectedAt).toLocaleString());
  console.log(
    'result[result.length - 1]',
    new Date(result[result.length - 1].collectedAt).toLocaleString(),
  );
  return result;
};
