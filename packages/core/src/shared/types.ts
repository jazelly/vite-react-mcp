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

export type ToolkitTuningModalStyleSlot =
  | 'root'
  | 'surface'
  | 'panel'
  | 'arrow'
  | 'title'
  | 'body'
  | 'targetTag'
  | 'customPromptForm'
  | 'customPromptInput'
  | 'customPromptButton'
  | 'sectionTitle'
  | 'row'
  | 'label'
  | 'controlWrap'
  | 'control'
  | 'colorInput'
  | 'numberInput'
  | 'stepperButton'
  | 'select'
  | 'textarea'
  | 'suffix'
  | 'closeButton';

export type ToolkitTuningModalStyleValue = string | number;

export type ToolkitTuningModalStyle = Record<
  string,
  ToolkitTuningModalStyleValue
>;

export interface ToolkitTuningModalConfig {
  classNames?: Partial<Record<ToolkitTuningModalStyleSlot, string>>;
  styles?: Partial<
    Record<ToolkitTuningModalStyleSlot, ToolkitTuningModalStyle>
  >;
  tokens?: Record<string, ToolkitTuningModalStyleValue>;
}

export interface ToolkitConfig {
  enabled?: boolean;
  defaultVisible?: boolean;
  defaultExpanded?: boolean;
  position?: ToolkitPosition;
  offset?: ToolkitOffset;
  accentColor?: string;
  zIndex?: number;
  iconUrl?: string;
  tuningModal?: ToolkitTuningModalConfig;
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

export interface SelectionSourceTraceFrame {
  kind: 'external' | 'project';
  componentName: string | null;
  packageName: string | null;
  filePath: string;
  lineNumber: number | null;
  columnNumber: number | null;
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
  sourceTrace: SelectionSourceTraceFrame[];
  sourceSnippets: SelectionSourceSnippet[];
  tuningPrompts?: string[];
  capturedAt: number;
}

export interface TuningModalContext {
  element: Element;
  tagName: string;
  targetLabel: string;
  computedStyle: CSSStyleDeclaration;
  selectionContext: SelectionContext;
}

export interface TuningModalActions {
  addPrompt: (prompt: string) => void;
  close: () => void;
  requestReposition: () => void;
}

export interface TuningModalSlotRenderArgs {
  container: HTMLElement;
  context: TuningModalContext;
  actions: TuningModalActions;
}

export interface TuningModalWrapArgs {
  surfaceElement: HTMLElement;
  panelElement: HTMLElement;
  context: TuningModalContext;
  actions: TuningModalActions;
}

export type TuningModalExtensionCleanup = undefined | (() => void);

export interface TuningModalExtension {
  id: string;
  beforeFields?: (
    args: TuningModalSlotRenderArgs,
  ) => TuningModalExtensionCleanup;
  afterFields?: (
    args: TuningModalSlotRenderArgs,
  ) => TuningModalExtensionCleanup;
  footer?: (args: TuningModalSlotRenderArgs) => TuningModalExtensionCleanup;
  wrapModal?: (args: TuningModalWrapArgs) => TuningModalExtensionCleanup;
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
