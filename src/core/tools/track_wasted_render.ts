import {
  getDisplayName,
  getDisplayNameForFiber,
  getNearestFiberWithStateNode,
  isReactElement,
} from '../../shared/util';
import {
  traverseProps,
  fiberIdMap,
  type Fiber,
  didFiberCommit,
  getMutatedHostFibers,
  shouldFilterFiber,
  getFiberId,
} from 'bippy';
import { store, wastedRenderFiberInfo } from '../../shared/store';
import { flashStateNode } from './util';

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

type PropChangeReason =
  | -1 // prop ref
  | -2 // same value but different type
  | 1; // change is necessary
export const isRenderNecessaryByProp = (
  prevPropValue: unknown,
  currentPropValue: unknown,
): PropChangeReason => {
  // there are two cases where a prop change is wasted during a rerender
  // 1. All prop refs are not changed
  // 2. even when ref is changed, but due to re-instantiating, e.g. function in functional component
  if (prevPropValue === currentPropValue) return -1;
  if (
    stringifyValue(prevPropValue) === stringifyValue(currentPropValue) &&
    (typeof prevPropValue === 'function' ||
      typeof prevPropValue === 'object') &&
    (typeof currentPropValue === 'function' ||
      typeof currentPropValue === 'object')
  ) {
    return -2;
  }
  // Any other cases are necessary
  return 1;
};

export const isRenderNecessary = (
  fiber: Fiber,
  collectReasons?: (
    fiber: Fiber,
    propName: string,
    prevValue: string,
    nextValue: string,
    reasonFlag: PropChangeReason,
  ) => any,
): boolean => {
  if (!didFiberCommit(fiber)) return false;

  const rerenderedHostFibers = getMutatedHostFibers(fiber);
  let necessaryChange = false;
  for (const rerenderedHostFiber of rerenderedHostFibers) {
    traverseProps(
      rerenderedHostFiber,
      (propsName: string, prevValue: unknown, nextValue: unknown) => {
        const propChange = isRenderNecessaryByProp(prevValue, nextValue);
        if (propChange > 0) {
          necessaryChange = true;
          return true;
        }
        if (collectReasons) {
          collectReasons(
            rerenderedHostFiber,
            propsName,
            serializeFiberProps(prevValue),
            serializeFiberProps(nextValue),
            propChange,
          );
        }
      },
    );
  }
  return necessaryChange;
};

function serializeFiberProps(
  props,
  options: {
    visited?: Set<any>;
    maxDepth?: number;
    currentDepth?: number;
  } = {},
) {
  // Initialize options with defaults
  const visited = options.visited || new Set();
  const maxDepth = options.maxDepth || 10;
  const currentDepth = options.currentDepth || 0;

  // Check for null or undefined
  if (props === null || props === undefined) {
    return props;
  }

  // Handle primitive values directly
  if (typeof props !== 'object' && typeof props !== 'function') {
    return props;
  }

  // Check for circular references and max depth
  if (visited.has(props) || currentDepth >= maxDepth) {
    return '[Circular Reference]';
  }

  // Add current object to visited set
  visited.add(props);

  // Handle arrays
  if (Array.isArray(props)) {
    const serializedArray = [];
    for (let i = 0; i < props.length; i++) {
      serializedArray[i] = serializeFiberProps(props[i], {
        visited,
        maxDepth,
        currentDepth: currentDepth + 1,
      });
    }
    return serializedArray;
  }

  // Handle React elements
  if (props.$$typeof === Symbol.for('react.element')) {
    return {
      type:
        typeof props.type === 'function'
          ? props.type.name || 'FunctionComponent'
          : props.type,
      key: props.key,
      ref: props.ref ? '[Ref]' : null,
      props: serializeFiberProps(props.props, {
        visited,
        maxDepth,
        currentDepth: currentDepth + 1,
      }),
    };
  }

  // Handle other Fiber nodes
  if (Object.getPrototypeOf(props).constructor.name === 'FiberNode') {
    for (const key in props.memoizedProps) {
      props.memoizedProps[key] = serializeFiberProps(props.memoizedProps[key], {
        visited,
        maxDepth,
        currentDepth: currentDepth + 1,
      });
    }
  }

  // Handle regular objects
  const serializedObject = {};
  try {
    for (const key in props) {
      // Skip properties that might cause issues
      if (
        key === '__proto__' ||
        !Object.prototype.hasOwnProperty.call(props, key)
      ) {
        continue;
      }

      try {
        const value = props[key];

        // Handle functions
        if (typeof value === 'function') {
          serializedObject[key] = `[Function: ${value.name || 'anonymous'}]`;
          continue;
        }

        // Handle DOM nodes
        if (value instanceof Node) {
          serializedObject[key] = `[DOM Element: ${value.nodeName}]`;
          continue;
        }

        // Handle errors
        if (value instanceof Error) {
          serializedObject[key] = `[Error: ${value.message}]`;
          continue;
        }

        // Handle dates
        if (value instanceof Date) {
          serializedObject[key] = value.toISOString();
          continue;
        }

        // Handle RegExp
        if (value instanceof RegExp) {
          serializedObject[key] = value.toString();
          continue;
        }

        // Recursively serialize other values
        serializedObject[key] = serializeFiberProps(value, {
          visited,
          maxDepth,
          currentDepth: currentDepth + 1,
        });
      } catch (err: any) {
        serializedObject[key] = `[Unserializable: ${err.message}]`;
      }
    }
  } catch (err: any) {
    return `[Unserializable Object: ${err.message}]`;
  }

  return serializedObject;
}

export const collectUnnecessaryRender = (fiber: Fiber) => {
  const rawReasons = new Map<number, Record<string, any>>();
  const collectReasonsImpl = (
    hostFiber: Fiber,
    propName: string,
    prevValue: string,
    nextValue: string,
    reasonFlag: PropChangeReason,
  ) => {
    let fiberId = fiberIdMap.get(hostFiber);
    if (!fiberId) {
      fiberId = getFiberId(fiber);
    }
    const propsMap = rawReasons.get(fiberId) ?? {};
    if (reasonFlag === -1) {
      propsMap[propName] = {
        explanation: 'Prop reference not changed',
        prevValue,
        nextValue,
      };
    }
    if (reasonFlag === -2) {
      propsMap[propName] = {
        explanation: 'Prop value is the same but re-instantiated',
        prevValue,
        nextValue,
      };
    }

    rawReasons.set(fiberId, propsMap);
  };
  // this should only be called when fiber is updating
  // mounting or unmounting of a fiber is not considered as wasted render
  if (
    !shouldFilterFiber(fiber) &&
    !isRenderNecessary(fiber, collectReasonsImpl)
  ) {
    const name = getDisplayNameForFiber(fiber);
    const collectedAt = Date.now();
    const commitId = store.currentCommitFrameId;
    const fiberWithStateNode = getNearestFiberWithStateNode(fiber);

    let fiberId = fiberIdMap.get(fiber);
    if (!fiberId) {
      fiberId = getFiberId(fiber);
    }

    // we cannot use name for wasted render info
    // unless we make sure same named components are identified by id
    // better to use a unique id of the fiber
    wastedRenderFiberInfo.set(fiberId, {
      name,
      stateNode: fiberWithStateNode?.stateNode,
      collectedAt,
      commitId,
      fiber,
      reasons: rawReasons,
    });
  }
};

export const queryWastedRender = (
  timeframe: number,
  { allComponents = false, debugMode = false }: { allComponents?: boolean; debugMode?: boolean } = {},
) => {
  const result = [];
  let start = 0;
  const end = Date.now();
  if (timeframe && typeof timeframe === 'number') start = Date.now() - timeframe * 1000;

  for (const wastedRender of wastedRenderFiberInfo.values()) {
    if (
      wastedRender.collectedAt >= start &&
      wastedRender.collectedAt <= end &&
      wastedRender.fiber.return &&
      (allComponents ||
        window.__REACT_COMPONENTS__.includes(wastedRender.name))
    ) {
      result.push(wastedRender);
    }
  }

  result.sort((a, b) => a.collectedAt - b.collectedAt);

  // reduce results with same stateNode and flash them
  const reducedResult = [];
  for (const wastedRender of result) {
    if (!reducedResult.some((r) => r.stateNode === wastedRender.stateNode)) {
      flashStateNode(wastedRender.stateNode, {
        commitId: wastedRender.commitId,
      });
      reducedResult.push(wastedRender);
    }
  }

  const finalResult = result.map((wastedRender) => {
    return {
      name: wastedRender.name,
      commitId: wastedRender.commitId,
      collectedAt: wastedRender.collectedAt,
      reasons: wastedRender.reasons,
    };
  });

  if (debugMode) {
    console.debug('wastedRenders', finalResult);
  }

  return finalResult;
};
