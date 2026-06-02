const SOURCE_FILE_EXTENSION_PATTERN = /\.(jsx?|tsx?)$/i;
const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /^[a-zA-Z]:\//;

export type SourcePathKind =
  | 'invalid'
  | 'url'
  | 'vite-fs'
  | 'fs-absolute'
  | 'vite-root-relative'
  | 'project-relative';

export interface SourcePathClassification {
  kind: SourcePathKind;
  normalizedPath: string;
  isSourceFile: boolean;
  withinSourceRoot: boolean;
}

export const normalizeSourceRoot = (sourceRoot?: string): string =>
  (sourceRoot || '').trim().replace(/\\/g, '/').replace(/\/$/, '');

const normalizeSourcePath = (filePath: string): string =>
  filePath
    .trim()
    .replace(/\\/g, '/')
    .replace(/[?#].*$/, '');

const hasRestrictedPathSegment = (normalizedPath: string): boolean => {
  const pathSegments = normalizedPath.split('/').filter(Boolean);
  return (
    pathSegments.includes('node_modules') || pathSegments.includes('.vite')
  );
};

const hasParentTraversal = (normalizedPath: string): boolean =>
  normalizedPath.split('/').includes('..');

const isWindowsAbsolutePath = (normalizedPath: string): boolean =>
  WINDOWS_ABSOLUTE_PATH_PATTERN.test(normalizedPath);

const isWithinSourceRoot = (
  normalizedPath: string,
  normalizedSourceRoot: string,
): boolean => {
  if (!normalizedSourceRoot) {
    return false;
  }

  return (
    normalizedPath === normalizedSourceRoot ||
    normalizedPath.startsWith(`${normalizedSourceRoot}/`)
  );
};

export const classifySourcePath = (
  filePath: string,
  sourceRoot?: string,
): SourcePathClassification => {
  const normalizedSourceRoot = normalizeSourceRoot(sourceRoot);
  const normalizedPath = normalizeSourcePath(filePath || '');

  if (!normalizedPath || normalizedPath.includes('\0')) {
    return {
      kind: 'invalid',
      normalizedPath,
      isSourceFile: false,
      withinSourceRoot: false,
    };
  }

  if (PROTOCOL_PATTERN.test(normalizedPath)) {
    return {
      kind: 'url',
      normalizedPath,
      isSourceFile: false,
      withinSourceRoot: false,
    };
  }

  const isSourceFile =
    SOURCE_FILE_EXTENSION_PATTERN.test(normalizedPath) &&
    !hasRestrictedPathSegment(normalizedPath);

  if (!isSourceFile) {
    return {
      kind: 'invalid',
      normalizedPath,
      isSourceFile: false,
      withinSourceRoot: false,
    };
  }

  if (normalizedPath.startsWith('/@fs/')) {
    const fileSystemPath = normalizedPath.slice('/@fs'.length);
    return {
      kind: 'vite-fs',
      normalizedPath,
      isSourceFile,
      withinSourceRoot: isWithinSourceRoot(
        fileSystemPath,
        normalizedSourceRoot,
      ),
    };
  }

  if (isWindowsAbsolutePath(normalizedPath)) {
    return {
      kind: 'fs-absolute',
      normalizedPath,
      isSourceFile,
      withinSourceRoot: isWithinSourceRoot(
        normalizedPath,
        normalizedSourceRoot,
      ),
    };
  }

  if (normalizedPath.startsWith('/')) {
    const withinSourceRoot = isWithinSourceRoot(
      normalizedPath,
      normalizedSourceRoot,
    );
    return {
      kind: withinSourceRoot ? 'fs-absolute' : 'vite-root-relative',
      normalizedPath,
      isSourceFile,
      withinSourceRoot: withinSourceRoot || !hasParentTraversal(normalizedPath),
    };
  }

  return {
    kind: 'project-relative',
    normalizedPath,
    isSourceFile,
    withinSourceRoot: !hasParentTraversal(normalizedPath),
  };
};

const toViteFsUrl = (fileSystemPath: string): string =>
  fileSystemPath.startsWith('/')
    ? `/@fs${fileSystemPath}`
    : `/@fs/${fileSystemPath}`;

const joinNormalizedPath = (basePath: string, childPath: string): string =>
  `${basePath.replace(/\/$/, '')}/${childPath.replace(/^\//, '')}`;

export const toAbsoluteSourcePath = (
  filePath: string,
  sourceRoot?: string,
): string | null => {
  const normalizedSourceRoot = normalizeSourceRoot(sourceRoot);
  const classifiedPath = classifySourcePath(filePath, normalizedSourceRoot);

  if (!classifiedPath.isSourceFile || !classifiedPath.withinSourceRoot) {
    return null;
  }

  if (classifiedPath.kind === 'vite-fs') {
    return classifiedPath.normalizedPath.slice('/@fs'.length);
  }

  if (classifiedPath.kind === 'fs-absolute') {
    return classifiedPath.normalizedPath;
  }

  if (!normalizedSourceRoot) {
    return null;
  }

  if (classifiedPath.kind === 'vite-root-relative') {
    return joinNormalizedPath(
      normalizedSourceRoot,
      classifiedPath.normalizedPath,
    );
  }

  if (classifiedPath.kind === 'project-relative') {
    const sanitizedPath = classifiedPath.normalizedPath
      .replace(/^\.?\//, '')
      .replace(/\/\.\//g, '/');
    const sourceRootName = normalizedSourceRoot.split('/').filter(Boolean).pop();
    if (
      sourceRootName &&
      sanitizedPath.startsWith(`${sourceRootName}/src/`)
    ) {
      return joinNormalizedPath(
        normalizedSourceRoot,
        sanitizedPath.slice(sourceRootName.length + 1),
      );
    }

    return joinNormalizedPath(normalizedSourceRoot, sanitizedPath);
  }

  return null;
};

export const buildBrowserSourceCandidates = (
  filePath: string,
  sourceRoot?: string,
): string[] => {
  const classifiedPath = classifySourcePath(filePath, sourceRoot);

  if (!classifiedPath.isSourceFile || !classifiedPath.withinSourceRoot) {
    return [];
  }

  if (classifiedPath.kind === 'vite-fs') {
    return [
      `${classifiedPath.normalizedPath}?raw`,
      classifiedPath.normalizedPath,
    ];
  }

  if (classifiedPath.kind === 'fs-absolute') {
    const viteFsUrl = toViteFsUrl(classifiedPath.normalizedPath);
    return [`${viteFsUrl}?raw`, viteFsUrl];
  }

  if (classifiedPath.kind === 'vite-root-relative') {
    return [
      `${classifiedPath.normalizedPath}?raw`,
      classifiedPath.normalizedPath,
    ];
  }

  if (classifiedPath.kind === 'project-relative') {
    const sanitizedPath = classifiedPath.normalizedPath.replace(/^\.?\//, '');
    const rootRelativePath = `/${sanitizedPath}`;
    return [`${rootRelativePath}?raw`, rootRelativePath];
  }

  return [];
};

export const isAllowedProjectSourcePath = (
  filePath: string,
  sourceRoot?: string,
): boolean => {
  const classifiedPath = classifySourcePath(filePath, sourceRoot);
  return classifiedPath.isSourceFile && classifiedPath.withinSourceRoot;
};
