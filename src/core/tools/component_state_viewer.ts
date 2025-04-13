import { FiberNotFoundError } from '../../shared/errors';
import { getCurrentStates, getPrevStates } from '../../shared/util';
import type { HookNode } from '../../types/internal';
import { getFibersByComponentName } from './util';

export const getComponentStates = (
  componentName: string,
): Map<
  string,
  {
    currentStates: HookNode[] | null;
    prevStates: HookNode[] | null;
  }
> => {
  const fibers = getFibersByComponentName(componentName);

  if (fibers.length === 0)
    throw new FiberNotFoundError(
      `No fibers found for component: ${componentName}`,
    );

  const stateMap = new Map<
    string,
    {
      currentStates: HookNode[] | null;
      prevStates: HookNode[] | null;
    }
  >();

  let id = 1;
  let suffix = ` #${id}`;
  if (fibers.length <= 1) {
    suffix = '';
  }
  for (const fiber of fibers) {
    const currentStates = getCurrentStates(fiber);
    const prevStates = getPrevStates(fiber);

    stateMap.set(`${componentName}${suffix}`, {
      currentStates: filterReportableStates(currentStates),
      prevStates: filterReportableStates(prevStates),
    });

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
