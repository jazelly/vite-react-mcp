// A mapping of React flow types to TypeScript types needed by this package
// https://github.com/facebook/react/tree/main/packages/react-devtools-shared/src/backend/types.js

import type { Fiber } from 'bippy';
import type { Lane, Lanes } from 'react-reconciler';
export interface FiberRoot {
  callbackNode: null | object;
  callbackPriority: number;
  containerInfo: HTMLElement; // div#root in this case
  context: object;
  current: Fiber;
  effectDuration: number;
  entangledLanes: number;
  entanglements: number[];
  eventTimes: number[];
  expirationTimes: number[];
  expiredLanes: number;
  finishedLanes: number;
  finishedWork: null | Fiber;
  identifierPrefix: string;
  memoizedUpdaters: Set<unknown>;
  mutableReadLanes: number;
  mutableSourceEagerHydrationData: null | any[];
  onRecoverableError: (error: Error) => void;
  passiveEffectDuration: number;
  pendingChildren: null | any;
  pendingContext: null | object;
  pendingLanes: number;
  pendingUpdatersLaneMap: Set<unknown>[];
  pingCache: null | Map<unknown, unknown>;
  pingedLanes: number;
  suspendedLanes: number;
  tag: number;
  timeoutHandle: number;
  _debugRootType: string;
}

export interface MemoizedState {
  memoizedState: unknown;
  next: MemoizedState | null;
  [key: string]: unknown;
}

export type ReactCallSite = [
  string, // function name
  string, // file name TODO: model nested eval locations as nested arrays
  number, // line number
  number, // column number
];

export interface ReactDevtools {
  checkDCE: (fn: unknown) => void;
  supportsFiber: boolean;
  supportsFlight: boolean;
  renderers: Map<number, ReactRenderer>;
  hasUnsupportedRendererAttached: boolean;
  getFiberRoots: (rendererID: number) => Set<FiberRoot>;
  onCommitFiberRoot: (
    rendererID: number,
    root: FiberRoot,
    priority: undefined | number,
  ) => void;
  onCommitFiberUnmount: (rendererID: number, fiber: Fiber) => void;
  onPostCommitFiberRoot: (rendererID: number, root: FiberRoot) => void;
  inject: (renderer: ReactRenderer) => number;
}

export type ReactStackTrace = Array<ReactCallSite>;

export type ReactComponentInfo = {
  readonly name: string;
  readonly env?: string;
  readonly key?: null | string;
  readonly owner?: null | ReactComponentInfo;
  readonly stack?: null | ReactStackTrace;
  readonly props?: null | { [name: string]: unknown };
};

export type HostInstance = object;

export type BundleType =
  | 0 // PROD
  | 1; // DEV

// The subset of a Thenable required by things thrown by Suspense.
// This doesn't require a value to be passed to either handler.
export interface Wakeable {
  then(onFulfill: () => unknown, onReject: () => unknown): undefined | Wakeable;
}

export type DevToolsProfilingHooks = {
  // Scheduling methods:
  markRenderScheduled: (lane: Lane) => void;
  markStateUpdateScheduled: (fiber: Fiber, lane: Lane) => void;
  markForceUpdateScheduled: (fiber: Fiber, lane: Lane) => void;

  // Work loop level methods:
  markRenderStarted: (lanes: Lanes) => void;
  markRenderYielded: () => void;
  markRenderStopped: () => void;
  markCommitStarted: (lanes: Lanes) => void;
  markCommitStopped: () => void;
  markLayoutEffectsStarted: (lanes: Lanes) => void;
  markLayoutEffectsStopped: () => void;
  markPassiveEffectsStarted: (lanes: Lanes) => void;
  markPassiveEffectsStopped: () => void;

  // Fiber level methods:
  markComponentRenderStarted: (fiber: Fiber) => void;
  markComponentRenderStopped: () => void;
  markComponentErrored: (
    fiber: Fiber,
    thrownValue: unknown,
    lanes: Lanes,
  ) => void;
  markComponentSuspended: (
    fiber: Fiber,
    wakeable: Wakeable,
    lanes: Lanes,
  ) => void;
  markComponentLayoutEffectMountStarted: (fiber: Fiber) => void;
  markComponentLayoutEffectMountStopped: () => void;
  markComponentLayoutEffectUnmountStarted: (fiber: Fiber) => void;
  markComponentLayoutEffectUnmountStopped: () => void;
  markComponentPassiveEffectMountStarted: (fiber: Fiber) => void;
  markComponentPassiveEffectMountStopped: () => void;
  markComponentPassiveEffectUnmountStarted: (fiber: Fiber) => void;
  markComponentPassiveEffectUnmountStopped: () => void;
};

type Dispatcher = any;
export type LegacyDispatcherRef = { current: null | Dispatcher };
type SharedInternalsSubset = {
  H: null | Dispatcher;
};
export type CurrentDispatcherRef = SharedInternalsSubset;

export interface ReactRenderer {
  version: string;
  rendererPackageName: string;
  bundleType: BundleType;
  // 16.0+ - To be removed in future versions.
  findFiberByHostInstance?: (hostInstance: HostInstance) => Fiber | null;
  // 16.9+
  overrideHookState?: (
    fiber?: object,
    id?: number,
    path?: Array<string | number>,
    value?: any,
  ) => void;
  // 17+
  overrideHookStateDeletePath?: (
    fiber?: object,
    id?: number,
    path?: Array<string | number>,
  ) => void;
  // 17+
  overrideHookStateRenamePath?: (
    fiber: Object,
    id: number,
    oldPath: Array<string | number>,
    newPath: Array<string | number>,
  ) => void;
  // 16.7+
  overrideProps?: (
    fiber?: object,
    path?: Array<string | number>,
    value?: any,
  ) => void;
  // 17+
  overridePropsDeletePath?: (
    fiber?: object,
    path?: Array<string | number>,
  ) => void;
  // 17+
  overridePropsRenamePath?: (
    fiber?: object,
    oldPath?: Array<string | number>,
    newPath?: Array<string | number>,
  ) => void;
  // 16.9+
  scheduleUpdate?: (fiber?: object) => void;
  setSuspenseHandler?: (shouldSuspend: (fiber?: object) => boolean) => void;
  // Only injected by React v16.8+ in order to support hooks inspection.
  currentDispatcherRef?: LegacyDispatcherRef | CurrentDispatcherRef;
  // Only injected by React v16.9+ in DEV mode.
  // Enables DevTools to append owners-only component stack to error messages.
  getCurrentFiber?: (() => Fiber | null) | null;
  // Only injected by React Flight Clients in DEV mode.
  // Enables DevTools to append owners-only component stack to error messages from Server Components.
  getCurrentComponentInfo?: () => ReactComponentInfo | null;
  // 17.0.2+
  reconcilerVersion?: string;
  // Uniquely identifies React DOM v15.
  ComponentTree?: any;
  // Present for React DOM v12 (possibly earlier) through v15.
  Mount?: any;
  // Only injected by React v17.0.3+ in DEV mode
  setErrorHandler?: (
    shouldError?: (fiber: Object) => boolean | undefined,
  ) => void;
  // Intentionally opaque type to avoid coupling DevTools to different Fast Refresh versions.
  scheduleRefresh?: () => void;
  // 18.0+
  injectProfilingHooks?: (profilingHooks: DevToolsProfilingHooks) => void;
  getLaneLabelMap?: () => Map<Lane, string> | null;
  // Other renderer methods
}
