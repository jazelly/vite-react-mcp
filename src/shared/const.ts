export const __VITE_REACT_MCP_TOOLS__ = '__VITE_REACT_MCP_TOOLS__';

export const target = (
  typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
      ? globalThis
      : {}
) as typeof globalThis;

// https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/backend/shared/ReactSymbols.js
export const CONCURRENT_MODE_NUMBER = 0xeacf;
export const CONCURRENT_MODE_SYMBOL_STRING = 'Symbol(react.concurrent_mode)';

export const CONTEXT_NUMBER = 0xeace;
export const CONTEXT_SYMBOL_STRING = 'Symbol(react.context)';

export const SERVER_CONTEXT_SYMBOL_STRING = 'Symbol(react.server_context)';

export const DEPRECATED_ASYNC_MODE_SYMBOL_STRING = 'Symbol(react.async_mode)';

export const ELEMENT_SYMBOL_STRING = 'Symbol(react.transitional.element)';
export const LEGACY_ELEMENT_NUMBER = 0xeac7;
export const LEGACY_ELEMENT_SYMBOL_STRING = 'Symbol(react.element)';

export const DEBUG_TRACING_MODE_NUMBER = 0xeae1;
export const DEBUG_TRACING_MODE_SYMBOL_STRING =
  'Symbol(react.debug_trace_mode)';

export const FORWARD_REF_NUMBER = 0xead0;
export const FORWARD_REF_SYMBOL_STRING = 'Symbol(react.forward_ref)';

export const FRAGMENT_NUMBER = 0xeacb;
export const FRAGMENT_SYMBOL_STRING = 'Symbol(react.fragment)';

export const LAZY_NUMBER = 0xead4;
export const LAZY_SYMBOL_STRING = 'Symbol(react.lazy)';

export const MEMO_NUMBER = 0xead3;
export const MEMO_SYMBOL_STRING = 'Symbol(react.memo)';

export const PORTAL_NUMBER = 0xeaca;
export const PORTAL_SYMBOL_STRING = 'Symbol(react.portal)';

export const PROFILER_NUMBER = 0xead2;
export const PROFILER_SYMBOL_STRING = 'Symbol(react.profiler)';

export const PROVIDER_NUMBER = 0xeacd;
export const PROVIDER_SYMBOL_STRING = 'Symbol(react.provider)';

export const CONSUMER_SYMBOL_STRING = 'Symbol(react.consumer)';

export const SCOPE_NUMBER = 0xead7;
export const SCOPE_SYMBOL_STRING = 'Symbol(react.scope)';

export const STRICT_MODE_NUMBER = 0xeacc;
export const STRICT_MODE_SYMBOL_STRING = 'Symbol(react.strict_mode)';

export const SUSPENSE_NUMBER = 0xead1;
export const SUSPENSE_SYMBOL_STRING = 'Symbol(react.suspense)';

export const SUSPENSE_LIST_NUMBER = 0xead8;
export const SUSPENSE_LIST_SYMBOL_STRING = 'Symbol(react.suspense_list)';

export const SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED_SYMBOL_STRING =
  'Symbol(react.server_context.defaultValue)';

export const REACT_MEMO_CACHE_SENTINEL: symbol = Symbol.for(
  'react.memo_cache_sentinel',
);

export const REACT_ELEMENT_TYPE =
  (typeof Symbol !== 'undefined' && Symbol.for && Symbol.for('react.element')) ||
  LEGACY_ELEMENT_NUMBER;

// https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/backend/fiber/renderer.js
export const ReactTypeOfWork = {
  CacheComponent: 24, // Experimental
  ClassComponent: 1,
  ContextConsumer: 9,
  ContextProvider: 10,
  DehydratedSuspenseComponent: 18, // Behind a flag
  ForwardRef: 11,
  Fragment: 7,
  FunctionComponent: 0,
  HostComponent: 5,
  HostPortal: 4,
  HostRoot: 3,
  HostHoistable: 26, // In reality, 18.2+. But doesn't hurt to include it here
  HostSingleton: 27, // Same as above
  HostText: 6,
  IncompleteClassComponent: 17,
  IncompleteFunctionComponent: 28,
  IndeterminateComponent: 2, // removed in 19.0.0
  LazyComponent: 16,
  LegacyHiddenComponent: 23,
  MemoComponent: 14,
  Mode: 8,
  OffscreenComponent: 22, // Experimental
  Profiler: 12,
  ScopeComponent: 21, // Experimental
  SimpleMemoComponent: 15,
  SuspenseComponent: 13,
  SuspenseListComponent: 19, // Experimental
  TracingMarkerComponent: 25, // Experimental - This is technically in 18 but we don't
  // want to fork again so we're adding it here instead
  Throw: 29,
  ViewTransitionComponent: 30, // Experimental
  ActivityComponent: 31,
};

// https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberFlags.js
export const PerformedWork = 0b1;
export const Placement = 0b10;
export const Hydrating = 0b1000000000000;
export const Update = 0b100;
export const Cloned = 0b1000;
export const ChildDeletion = 0b10000;
export const ContentReset = 0b100000;
export const Snapshot = 0b10000000000;
export const Visibility = 0b10000000000000;
export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Hydrating |
  Visibility |
  Snapshot;
