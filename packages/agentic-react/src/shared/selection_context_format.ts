import type {
  SelectionContext,
  SelectionResolvedSource,
  SelectionSourceSnippet,
  SelectionSourceTraceFrame,
} from './types.js';

const formatDisplayFilePath = (filePath: string): string =>
  filePath.startsWith('/src/') ? filePath.slice(1) : filePath;

const formatSourceLocation = (source: SelectionResolvedSource): string => {
  const filePath = formatDisplayFilePath(source.filePath);
  const line = source.lineNumber != null ? `:${source.lineNumber}` : '';
  const column = source.columnNumber != null ? `:${source.columnNumber}` : '';
  return `${filePath}${line}${column}`;
};

const formatComponentSourceLine = (source: SelectionResolvedSource): string => {
  const location = formatSourceLocation(source);
  return source.componentName
    ? `  in ${source.componentName} (at ${location})`
    : `  in ${location}`;
};

const formatExternalComponentLine = (
  selectionContext: SelectionContext,
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
    ? ` used by ${usedBy.componentName ?? 'local component'} at ${formatSourceLocation(usedBy)}`
    : '';

  return `selected external component: <${externalComponent.componentName}>${packageName}${usedByText}`;
};

const formatSourceSnippet = (sourceSnippet: SelectionSourceSnippet): string =>
  [
    `Source (${formatDisplayFilePath(sourceSnippet.filePath)}:${sourceSnippet.startLine}-${sourceSnippet.endLine})`,
    sourceSnippet.snippet,
  ].join('\n');

const formatTraceFrameLine = (
  traceFrame: SelectionSourceTraceFrame,
  index: number,
): string => {
  const arrow = index === 0 ? '  ' : '  -> ';
  const location = formatSourceLocation(traceFrame);
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
): string => {
  if (sourceTrace.length === 0) return '';

  return [
    'source trace:',
    ...sourceTrace.map((traceFrame, index) =>
      formatTraceFrameLine(traceFrame, index),
    ),
  ].join('\n');
};

export const buildComponentSourceChain = (
  resolvedSources: SelectionResolvedSource[],
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
    lines.push(formatComponentSourceLine(source));
  }

  return lines.join('\n');
};

export const buildSelectionSourcePreview = (
  selectionContext: SelectionContext,
): string | null => {
  const snippetText = selectionContext.sourceSnippets
    .map(formatSourceSnippet)
    .join('\n\n');
  const sourceChain = buildComponentSourceChain(
    selectionContext.resolvedSources,
  );
  const sourceTrace = buildSourceTracePreview(
    selectionContext.sourceTrace ?? [],
  );
  const externalComponentLine = formatExternalComponentLine(selectionContext);
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
): string => {
  const summaryLines: string[] = [];
  const sourcePreview =
    selectionContext.sourcePreview ||
    buildSelectionSourcePreview(selectionContext);

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
