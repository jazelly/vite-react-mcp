import type { Fiber } from 'bippy';
import { FiberNotFoundError } from '../../shared/errors';
import {
  getCurrentContexts,
  getCurrentProps,
  getCurrentStates,
} from '../../shared/util';
import type { HookNode } from '../../types/internal';
import { getFibersByComponentName } from './util';

interface ComponentStateAndContext<T> {
  props: Fiber['memoizedProps'];
  states: Fiber['memoizedState'][];
  contexts: T[];
}

export const getComponentStates = (
  componentName: string,
  options: {
    debugMode?: boolean;
  } = {},
): Record<string, ComponentStateAndContext<unknown>> => {
  const fibers = getFibersByComponentName(componentName);

  if (fibers.length === 0)
    throw new FiberNotFoundError(
      `No fibers found for component: ${componentName}`,
    );

  const stateMap = {} as Record<string, ComponentStateAndContext<unknown>>;

  let id = 1;
  let suffix = ` #${id}`;
  if (fibers.length <= 1) {
    suffix = '';
  }

  for (const fiber of fibers) {
    if (options.debugMode) {
      console.debug('getComponentStates - fiber', fiber);
    }
    const currentStates = getCurrentStates(fiber);
    const currentProps = getCurrentProps(fiber);
    const currentContexts = getCurrentContexts(fiber);

    stateMap[`${componentName}${suffix}`] = {
      props: currentProps,
      states: currentStates,
      contexts: currentContexts,
    };

    id++;
    suffix = ` #${id}`;
  }

  return stateMap;
};

export const filterReportableStates = (states: HookNode[]): HookNode[] => {
  return states.filter((state) => {
    try {
      return (
        JSON.stringify(state.memoizedState) === JSON.stringify(state.baseState)
      );
    } catch (_error) {
      return false;
    }
  });
};
