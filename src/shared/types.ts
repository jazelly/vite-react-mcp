import type { ZodTypeAny } from 'zod';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ToolResultValue = string | JsonValue | undefined;

export type CustomClientFunction =
  | string
  | ((args: unknown) => ToolResultValue | Promise<ToolResultValue>);

export interface CustomTool {
  name: string;
  description: string;
  schema: ZodTypeAny;
  clientFunction: CustomClientFunction;
}