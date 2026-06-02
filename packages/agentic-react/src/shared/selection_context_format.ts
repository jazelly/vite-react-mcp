import type {
  SelectionContext,
  SelectionResolvedSource,
  SelectionSourceSnippet,
  SelectionSourceTraceFrame,
} from './types.js';
import { toAbsoluteSourcePath } from './source_path.js';

export const WEB_CONTEXT_TAG = 'web_context';
export const WEB_CONTEXT_TYPE_REACT_COMPONENT_LOCATION =
  'react_component_location';

interface SelectionContextFormatOptions {
  sourceRoot?: string;
}

const getPrimarySource = (
  selectionContext: SelectionContext,
): SelectionResolvedSource | SelectionSourceTraceFrame | null =>
  selectionContext.resolvedSources[0] ??
  selectionContext.externalComponent?.usedBy ??
  selectionContext.sourceTrace.find((frame) => frame.kind === 'project') ??
  null;

export const buildWebContextText = (
  selectionContext: SelectionContext,
  options: SelectionContextFormatOptions = {},
): string => {
  const lines: string[] = [];
  const componentName =
    selectionContext.componentName ||
    selectionContext.externalComponent?.componentName;
  const primarySource = getPrimarySource(selectionContext);
  const source = primarySource
    ? formatSourceLocation(primarySource, options)
    : null;
  const details = buildSelectionContextSummary(selectionContext, options);

  if (componentName) {
    lines.push(`component: ${componentName}`);
  }

  if (selectionContext.selector) {
    lines.push(`selector: ${selectionContext.selector}`);
  }

  if (source) {
    lines.push(`source: ${source}`);
  }

  if (details) {
    lines.push('', 'details:', details);
  }

  return `<${WEB_CONTEXT_TAG} type="${WEB_CONTEXT_TYPE_REACT_COMPONENT_LOCATION}">\n${lines.join('\n')}\n</${WEB_CONTEXT_TAG}>`;
};

const formatDisplayFilePath = (
  filePath: string,
  options: SelectionContextFormatOptions = {},
): string =>
  toAbsoluteSourcePath(filePath, options.sourceRoot) ??
  (filePath.startsWith('/src/') ? filePath.slice(1) : filePath);

const formatSourceLocation = (
  source: Pick<
    SelectionResolvedSource,
    'filePath' | 'lineNumber' | 'columnNumber'
  >,
  options: SelectionContextFormatOptions = {},
): string => {
  const filePath = formatDisplayFilePath(source.filePath, options);
  const line = source.lineNumber != null ? `:${source.lineNumber}` : '';
  const column = source.columnNumber != null ? `:${source.columnNumber}` : '';
  return `${filePath}${line}${column}`;
};

const formatComponentSourceLine = (
  source: SelectionResolvedSource,
  options: SelectionContextFormatOptions = {},
): string => {
  const location = formatSourceLocation(source, options);
  return source.componentName
    ? `  in ${source.componentName} (at ${location})`
    : `  in ${location}`;
};

const formatExternalComponentLine = (
  selectionContext: SelectionContext,
  options: SelectionContextFormatOptions = {},
): string | null => {
  const externalComponent = selectionContext.externalComponent;
  if (!externalComponent) {
    return null;
  }

  const packageName = externalComponent.packageName
    ? ` from ${externalComponent.packageName}`
    : '';
  const usedBy = externalComponent.usedBy;
  const usedByText = usedBy
    ? ` used by ${usedBy.componentName ?? 'local component'} at ${formatSourceLocation(usedBy, options)}`
    : '';

  return `selected external component: <${externalComponent.componentName}>${packageName}${usedByText}`;
};

const formatSourceSnippet = (
  sourceSnippet: SelectionSourceSnippet,
  options: SelectionContextFormatOptions = {},
): string =>
  [
    `Source (${formatDisplayFilePath(sourceSnippet.filePath, options)}:${sourceSnippet.startLine}-${sourceSnippet.endLine})`,
    sourceSnippet.snippet,
  ].join('\n');

const formatTraceFrameLine = (
  traceFrame: SelectionSourceTraceFrame,
  index: number,
  options: SelectionContextFormatOptions = {},
): string => {
  const arrow = index === 0 ? '  ' : '  -> ';
  const location = formatSourceLocation(traceFrame, options);
  const componentName = traceFrame.componentName
    ? `<${traceFrame.componentName}>`
    : '<unknown>';

  if (traceFrame.kind === 'external') {
    const packageName = traceFrame.packageName
      ? ` from ${traceFrame.packageName}`
      : '';
    const sourceLocation = traceFrame.packageName ? '' : ` at ${location}`;
    return `${arrow}${componentName}${packageName}${sourceLocation}`;
  }

  return traceFrame.componentName
    ? `${arrow}${traceFrame.componentName} at ${location}`
    : `${arrow}${location}`;
};

const buildSourceTracePreview = (
  sourceTrace: SelectionSourceTraceFrame[],
  options: SelectionContextFormatOptions = {},
): string => {
  if (sourceTrace.length === 0) return '';

  return [
    'source trace:',
    ...sourceTrace.map((traceFrame, index) =>
      formatTraceFrameLine(traceFrame, index, options),
    ),
  ].join('\n');
};

export const buildComponentSourceChain = (
  resolvedSources: SelectionResolvedSource[],
  options: SelectionContextFormatOptions = {},
): string => {
  const lines: string[] = [];
  const seenSourceKeys = new Set<string>();

  for (const source of resolvedSources) {
    if (!source.filePath) {
      continue;
    }

    const sourceKey = `${source.filePath}:${source.componentName ?? ''}`;
    if (seenSourceKeys.has(sourceKey)) {
      continue;
    }

    seenSourceKeys.add(sourceKey);
    lines.push(formatComponentSourceLine(source, options));
  }

  return lines.join('\n');
};

export const buildSelectionSourcePreview = (
  selectionContext: SelectionContext,
  options: SelectionContextFormatOptions = {},
): string | null => {
  const snippetText = selectionContext.sourceSnippets
    .map((sourceSnippet) => formatSourceSnippet(sourceSnippet, options))
    .join('\n\n');
  const sourceChain = buildComponentSourceChain(
    selectionContext.resolvedSources,
    options,
  );
  const sourceTrace = buildSourceTracePreview(
    selectionContext.sourceTrace ?? [],
    options,
  );
  const externalComponentLine = formatExternalComponentLine(
    selectionContext,
    options,
  );
  const shouldUseSourceTrace =
    Boolean(externalComponentLine) ||
    Boolean(
      selectionContext.sourceTrace?.some(
        (traceFrame) => traceFrame.kind === 'project',
      ),
    );
  const preview = [
    snippetText,
    externalComponentLine,
    shouldUseSourceTrace && sourceTrace ? sourceTrace : sourceChain,
  ]
    .filter(Boolean)
    .join('\n');

  return preview || null;
};

export const buildSelectionContextSummary = (
  selectionContext: SelectionContext,
  options: SelectionContextFormatOptions = {},
): string => {
  const summaryLines: string[] = [];
  const sourcePreview =
    options.sourceRoot || !selectionContext.sourcePreview
      ? buildSelectionSourcePreview(selectionContext, options)
      : selectionContext.sourcePreview;

  if (sourcePreview) {
    summaryLines.push(sourcePreview);
  } else {
    summaryLines.push(selectionContext.domPreview);
  }

  if (selectionContext.componentName) {
    summaryLines.push(`component: ${selectionContext.componentName}`);
  }

  if (selectionContext.tuningPrompts?.length) {
    summaryLines.push(
      [
        'tuning prompts:',
        ...selectionContext.tuningPrompts.map((prompt) => `- ${prompt}`),
      ].join('\n'),
    );
  }

  if (selectionContext.selector) {
    summaryLines.push(`selector: ${selectionContext.selector}`);
  }

  return summaryLines.join('\n');
};
