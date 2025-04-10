import { z } from 'zod';

export const HighlightComponentSchema = z.object({
  componentName: z.string().describe('The name of the component to highlight'),
});

export const GetComponentTreeSchema = z.object({
  matchId: z
    .string()
    .describe(
      'An identifier to filter the components that should be included in the component tree',
    ),
});

export const GetComponentStatesSchema = z.object({
  componentName: z
    .string()
    .describe('The name of the component to get the states of'),
});
