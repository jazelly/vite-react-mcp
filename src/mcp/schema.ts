import { z } from 'zod';

export const HighlightComponentSchema = z.object({
  componentName: z.string().describe('The name of the component to highlight'),
});
