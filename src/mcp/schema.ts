import { z } from 'zod';

export const HighlightComponentSchema = z.object({
  componentName: z.string().describe('The name of the component to highlight'),
});

export const GetComponentTreeSchema = z.object({
  selfOnly: z
    .boolean()
    .default(false)
    .describe('Whether to return your self defined components only'),
});

export const GetComponentStatesSchema = z.object({
  componentName: z
    .string()
    .describe('The name of the component to get the states of'),
});

export const GetUnnecessaryRerendersSchema = z.object({
  timeframe: z
    .number()
    .optional()
    .describe(
      'The timeframe to query wasted re-renders, in unit of seconds, e.g. 10 means last 10 seconds',
    ),
  allComponents: z
    .boolean()
    .default(false)
    .describe(
      'Whether to query wasted re-renders for all components. Must be explicitly stated to set this to true',
    ),
});
