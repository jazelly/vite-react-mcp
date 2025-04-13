import type { Fiber, Props, ReactDevToolsGlobalHook } from 'bippy';
import type { HookNode } from '../types/internal';
import type { FiberRoot, ReactDevtools } from '../types/react';
import {
  CONCURRENT_MODE_NUMBER,
  CONCURRENT_MODE_SYMBOL_STRING,
  CONSUMER_SYMBOL_STRING,
  CONTEXT_NUMBER,
  CONTEXT_SYMBOL_STRING,
  DEPRECATED_ASYNC_MODE_SYMBOL_STRING,
  FORWARD_REF_NUMBER,
  FORWARD_REF_SYMBOL_STRING,
  MEMO_NUMBER,
  MEMO_SYMBOL_STRING,
  PROFILER_NUMBER,
  PROFILER_SYMBOL_STRING,
  PROVIDER_NUMBER,
  PROVIDER_SYMBOL_STRING,
  REACT_ELEMENT_TYPE,
  REACT_MEMO_CACHE_SENTINEL,
  SCOPE_NUMBER,
  SCOPE_SYMBOL_STRING,
  SERVER_CONTEXT_SYMBOL_STRING,
  STRICT_MODE_NUMBER,
  STRICT_MODE_SYMBOL_STRING,
  target,
} from './const';
import { ReactTypeOfWork } from './const';
import { fiberRoots } from './store';

let rdtHook: ReactDevToolsGlobalHook | ReactDevtools | null = null;
export let usingRealHook = false;

export const getRDTHook: () => ReactDevToolsGlobalHook | ReactDevtools = () => {
  if (rdtHook) return rdtHook;
  if (!target.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    throw new Error('React DevTools is not installed');
  }

  rdtHook = target.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if ('getFiberRoots' in rdtHook) {
    usingRealHook = true;
  }
  return rdtHook;
};

export const getFiberRoots = (rendererId: number) => {
  const hook = getRDTHook();
  if (usingRealHook) {
    return (hook as ReactDevtools).getFiberRoots(rendererId);
  }

  if (!fiberRoots.has(rendererId)) {
    fiberRoots.set(rendererId, new Set());
  }
  return fiberRoots.get(rendererId);
};

/**
 * Get React Fiber nodes optimistically
 * @returns { Fiber[] }
 */
export const getAllFiberRoots = (): FiberRoot[] => {
  const hook = getRDTHook();
  let roots = [];
  if (hook.renderers.size > 0) {
    const rendererIds = Array.from(hook.renderers.keys());
    for (const rendererId of rendererIds) {
      const rootsSet = getFiberRoots(rendererId);
      roots = roots.concat([...rootsSet]);
    }
  }
  return roots;
};

/**
 * Traverse down to find the nearest fiber with stateNode UNDER the given fiber node
 * We step one level down first and then do bfs
 * @param fiber
 * @returns { Fiber | null }
 */
export const getNearestFiberWithStateNode = (
  fiber: Fiber,
  level?: number,
): Fiber | null => {
  // search down but in a bfs manner to find a fiber with stateNode
  const current = fiber;
  if (current.stateNode) {
    return current.stateNode;
  }
  // get down 1 level first
  let queue: Set<Fiber> = new Set();
  let nextQueue: Set<Fiber> = new Set();
  if (current.child) {
    queue.add(current.child);
  }

  let i = 0;
  while (queue.size > 0 && (level == null || i < +level)) {
    for (const f of queue) {
      let current = f;
      while (current) {
        if (current.stateNode) {
          return current;
        }
        if (current.child) {
          nextQueue.add(current.child);
        }
        current = current.sibling;
      }
    }
    queue.clear();
    [queue, nextQueue] = [nextQueue, queue];
    i++;
  }

  return null;
};

/**
 * Traverse fiber tree to find component by name
 */
export const findComponentsInFiber = (
  fiber: Fiber,
  componentName: string,
  results: Fiber[] = [],
) => {
  if (!fiber) return results;
  const fiberBase = fiber;
  const name = getDisplayNameForFiber(fiberBase);
  if (name?.includes(componentName)) {
    results.push(fiberBase);
  }

  if (fiberBase.child) {
    findComponentsInFiber(fiberBase.child, componentName, results);
  }
  if (fiberBase.sibling) {
    findComponentsInFiber(fiberBase.sibling, componentName, results);
  }

  return results;
};

export function getTypeSymbol(type: any): symbol | string | number {
  const symbolOrNumber =
    typeof type === 'object' && type !== null ? type.$$typeof : type;

  return typeof symbolOrNumber === 'symbol'
    ? symbolOrNumber.toString()
    : symbolOrNumber;
}

export function resolveFiberType(type: any): Fiber['type'] {
  const typeSymbol = getTypeSymbol(type);
  switch (typeSymbol) {
    case MEMO_NUMBER:
    case MEMO_SYMBOL_STRING:
      // recursively resolving memo type in case of memo(forwardRef(Component))
      return resolveFiberType(type.type);
    case FORWARD_REF_NUMBER:
    case FORWARD_REF_SYMBOL_STRING:
      return type.render;
    default:
      return type;
  }
}

// Mirror https://github.com/facebook/react/blob/7c21bf72ace77094fd1910cc350a548287ef8350/packages/shared/getComponentName.js#L27-L37
// Modified to have the option without wrapperName
export function getWrappedDisplayName(
  outerType: unknown,
  innerType: any,
  wrapperName?: string,
  fallbackName?: string,
): string {
  const displayName = (outerType as any)?.displayName;
  return (
    displayName ||
    (wrapperName
      ? `${wrapperName}(${getDisplayName(innerType, fallbackName)})`
      : getDisplayName(innerType, fallbackName))
  );
}

/**
 * Get the display name of a fiber node based on its type
 * @param type Fiber['type']
 * @param fallbackName The name we fallback in case there is no displayName, default Anonymous
 * @returns { string } Guaranteed to be a string
 */
export function getDisplayName(type: any, fallbackName = 'Anonymous'): string {
  let displayName = fallbackName;

  if (typeof type.displayName === 'string') {
    displayName = type.displayName;
  } else if (typeof type.name === 'string' && type.name !== '') {
    displayName = type.name;
  }

  return displayName;
}

/**
 * Get the display name of a fiber node
 * Refs: https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/backend/fiber/renderer.js
 * @param fiber
 * @param shouldSkipForgetCheck
 * @returns { string | null }
 */
export function getDisplayNameForFiber(
  fiber: Fiber,
  shouldSkipForgetCheck = false,
): string | null {
  const { elementType, type, tag } = fiber;

  let resolvedType = type;
  if (typeof type === 'object' && type !== null) {
    resolvedType = resolveFiberType(type);
  }

  let resolvedContext: any = null;
  if (
    !shouldSkipForgetCheck &&
    ((fiber.updateQueue as any)?.memoCache != null ||
      (Array.isArray(fiber.memoizedState?.memoizedState) &&
        fiber.memoizedState.memoizedState[0]?.[REACT_MEMO_CACHE_SENTINEL]) ||
      fiber.memoizedState?.memoizedState?.[REACT_MEMO_CACHE_SENTINEL])
  ) {
    const displayNameWithoutForgetWrapper = getDisplayNameForFiber(fiber, true);
    if (displayNameWithoutForgetWrapper == null) {
      return null;
    }

    return `Forget(${displayNameWithoutForgetWrapper})`;
  }

  switch (tag) {
    case ReactTypeOfWork.ActivityComponent:
      return 'Activity';
    case ReactTypeOfWork.CacheComponent:
      return 'Cache';
    case ReactTypeOfWork.ClassComponent:
    case ReactTypeOfWork.IncompleteClassComponent:
    case ReactTypeOfWork.IncompleteFunctionComponent:
    case ReactTypeOfWork.FunctionComponent:
    case ReactTypeOfWork.IndeterminateComponent:
      return getDisplayName(resolvedType);
    case ReactTypeOfWork.ForwardRef:
      return getWrappedDisplayName(
        elementType,
        resolvedType,
        null,
        'Anonymous',
      );
    case ReactTypeOfWork.HostRoot:
      const fiberRoot = fiber.stateNode;
      if (fiberRoot != null && fiberRoot._debugRootType !== null) {
        return fiberRoot._debugRootType;
      }
      return null;
    case ReactTypeOfWork.HostComponent:
    case ReactTypeOfWork.HostSingleton:
    case ReactTypeOfWork.HostHoistable:
      return type;
    case ReactTypeOfWork.HostPortal:
    case ReactTypeOfWork.HostText:
      return null;
    case ReactTypeOfWork.Fragment:
      return 'Fragment';
    case ReactTypeOfWork.LazyComponent:
      // This display name will not be user visible.
      // Once a Lazy component loads its inner component, React replaces the tag and type.
      // This display name will only show up in console logs when DevTools DEBUG mode is on.
      return 'Lazy';
    case ReactTypeOfWork.MemoComponent:
    case ReactTypeOfWork.SimpleMemoComponent:
      // Display name in React does not use `Memo` as a wrapper but fallback name.
      return getWrappedDisplayName(
        elementType,
        resolvedType,
        null,
        'Anonymous',
      );
    case ReactTypeOfWork.SuspenseComponent:
      return 'Suspense';
    case ReactTypeOfWork.LegacyHiddenComponent:
      return 'LegacyHidden';
    case ReactTypeOfWork.OffscreenComponent:
      return 'Offscreen';
    case ReactTypeOfWork.ScopeComponent:
      return 'Scope';
    case ReactTypeOfWork.SuspenseListComponent:
      return 'SuspenseList';
    case ReactTypeOfWork.Profiler:
      return 'Profiler';
    case ReactTypeOfWork.TracingMarkerComponent:
      return 'TracingMarker';
    case ReactTypeOfWork.ViewTransitionComponent:
      return 'ViewTransition';
    case ReactTypeOfWork.Throw:
      // This should really never be visible.
      return 'Error';
    default: {
      const typeSymbol = getTypeSymbol(type);

      switch (typeSymbol) {
        case CONCURRENT_MODE_NUMBER:
        case CONCURRENT_MODE_SYMBOL_STRING:
        case DEPRECATED_ASYNC_MODE_SYMBOL_STRING:
          return null;
        case PROVIDER_NUMBER:
        case PROVIDER_SYMBOL_STRING:
          // 16.3.0 exposed the context object as "context"
          // PR #12501 changed it to "_context" for 16.3.1+
          // NOTE Keep in sync with inspectElementRaw()
          resolvedContext = fiber.type._context || fiber.type.context;
          return `${resolvedContext.displayName || 'Context'}.Provider`;
        case CONTEXT_NUMBER:
        case CONTEXT_SYMBOL_STRING:
        case SERVER_CONTEXT_SYMBOL_STRING:
          if (
            fiber.type._context === undefined &&
            fiber.type.Provider === fiber.type
          ) {
            // In 19+, Context.Provider === Context, so this is a provider.
            resolvedContext = fiber.type;
            return `${resolvedContext.displayName || 'Context'}.Provider`;
          }

          // 16.3-16.5 read from "type" because the Consumer is the actual context object.
          // 16.6+ should read from "type._context" because Consumer can be different (in DEV).
          // NOTE Keep in sync with inspectElementRaw()
          resolvedContext = fiber.type._context || fiber.type;

          // NOTE: TraceUpdatesBackendManager depends on the name ending in '.Consumer'
          // If you change the name, figure out a more resilient way to detect it.
          return `${resolvedContext.displayName || 'Context'}.Consumer`;
        case CONSUMER_SYMBOL_STRING:
          // 19+
          resolvedContext = fiber.type._context;
          return `${resolvedContext.displayName || 'Context'}.Consumer`;
        case STRICT_MODE_NUMBER:
        case STRICT_MODE_SYMBOL_STRING:
          return null;
        case PROFILER_NUMBER:
        case PROFILER_SYMBOL_STRING:
          return `Profiler(${fiber.memoizedProps.id})`;
        case SCOPE_NUMBER:
        case SCOPE_SYMBOL_STRING:
          return 'Scope';
        default:
          // Unknown element type.
          // This may mean a new element type that has not yet been added to DevTools.
          return null;
      }
    }
  }
}

export const getCurrentStates = (fiber: Fiber): HookNode[] | null => {
  if (!fiber) return null;
  const states: HookNode[] = [];
  let state = fiber.memoizedState;
  while (state) {
    states.push({
      memoizedState: state.memoizedState,
      baseState: state.baseState,
    });
    state = state.next;
  }
  return states;
};

export const getPrevStates = (fiber: Fiber): HookNode[] | null => {
  if (!fiber.alternate) return null;
  const states: HookNode[] = [];
  let state = fiber.alternate?.memoizedState;
  while (state) {
    states.push({
      memoizedState: state.memoizedState,
      baseState: state.baseState,
    });
    state = state.next;
  }
  return states;
};

export const getCurrentProps = (fiber: Fiber): Props[] | null => {
  if (!fiber) return null;
  const props: Props[] = [];
  let prop = fiber.memoizedProps;
  while (prop) {
    props.push(prop);
    prop = prop.next as Props;
  }
  return props;
};

export const getPrevProps = (fiber: Fiber): Props[] | null => {
  if (!fiber.alternate) return null;
  const props: Props[] = [];
  let prop = fiber.alternate?.memoizedProps;
  while (prop) {
    props.push(prop);
    prop = prop.next as Props;
  }
  return props;
};

export const isReactElement = (thing: unknown): boolean => {
  return !!thing && (thing as any).$$typeof === REACT_ELEMENT_TYPE;
};
