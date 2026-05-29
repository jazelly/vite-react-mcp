import type { ZodTypeAny } from 'zod';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ToolResultValue = string | JsonValue | undefined;

export interface ToolkitOffset {
  x?: number;
  y?: number;
}

export type ToolkitPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ToolkitConfig {
  enabled?: boolean;
  defaultVisible?: boolean;
  defaultExpanded?: boolean;
  position?: ToolkitPosition;
  offset?: ToolkitOffset;
  accentColor?: string;
  zIndex?: number;
  iconUrl?: string;
}

export interface AgenticReactConfig {
  toolkit?: ToolkitConfig;
  sourceRoot?: string;
}

export interface SelectionStackFrame {
  functionName: string | null;
  fileName: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
}

export interface SelectionResolvedSource {
  filePath: string;
  lineNumber: number | null;
  columnNumber: number | null;
  componentName: string | null;
}

export interface SelectionExternalComponent {
  componentName: string;
  packageName: string | null;
  filePath: string | null;
  usedBy: SelectionResolvedSource | null;
}

export interface SelectionSourceSnippet {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

export interface SelectionContext {
  domPreview: string;
  sourcePreview: string | null;
  selector: string | null;
  componentName: string | null;
  externalComponent: SelectionExternalComponent | null;
  stackFrames: SelectionStackFrame[];
  resolvedSources: SelectionResolvedSource[];
  sourceSnippets: SelectionSourceSnippet[];
  capturedAt: number;
}

export type CustomClientFunction =
  | string
  | ((args: unknown) => ToolResultValue | Promise<ToolResultValue>);

export interface CustomTool {
  name: string;
  description: string;
  schema: ZodTypeAny;
  clientFunction: CustomClientFunction;
}
