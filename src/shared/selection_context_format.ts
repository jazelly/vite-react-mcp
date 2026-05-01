import type {
  SelectionContext,
  SelectionResolvedSource,
  SelectionSourceSnippet,
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

const formatSourceSnippet = (sourceSnippet: SelectionSourceSnippet): string =>
  [
    `Source (${formatDisplayFilePath(sourceSnippet.filePath)}:${sourceSnippet.startLine}-${sourceSnippet.endLine})`,
    sourceSnippet.snippet,
  ].join('\n');

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
  const preview = [snippetText, sourceChain].filter(Boolean).join('\n');

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

  if (selectionContext.selector) {
    summaryLines.push(`selector: ${selectionContext.selector}`);
  }

  return summaryLines.join('\n');
};
