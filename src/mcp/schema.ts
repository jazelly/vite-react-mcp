import { z } from 'zod';

export const HighlightComponentSchema = z.object({
  componentName: z.string().describe('The name of the component to highlight'),
});

export const GetComponentTreeSchema = z.object({
  allComponents: z
    .boolean()
    .default(false)
    .describe(
      'Whether to get tree for all components, instead of just your self-defined ones',
    ),
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

export const SetSelectionModeSchema = z.object({
  enabled: z
    .boolean()
    .describe('Whether to enable element selection mode in the browser'),
});

export const GetLastSelectionContextSchema = z.object({
  includeSourceSnippets: z
    .boolean()
    .default(true)
    .describe(
      'Whether source snippets should be included in the response payload',
    ),
  contextLines: z
    .number()
    .int()
    .min(0)
    .max(80)
    .default(10)
    .describe('How many lines to include before and after the resolved line'),
  maxFiles: z
    .number()
    .int()
    .min(1)
    .max(40)
    .default(8)
    .describe('Maximum number of source files to include in source snippets'),
});

export const CopyLastSelectionContextSchema = z.object({
  format: z
    .enum(['text', 'json'])
    .default('text')
    .describe('Clipboard payload format'),
});
