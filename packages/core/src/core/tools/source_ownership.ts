import type { Fiber } from 'bippy';
import { getSource, isSourceFile, normalizeFileName } from 'bippy/source';

const PATH_SEPARATOR_PATTERN = /[/\\]/;

const normalizeSourceFilePath = (fileName: string): string => {
  let normalizedFileName = normalizeFileName(fileName);
  normalizedFileName = normalizedFileName.replace(
    /^(?:\.\/)?\/?\([a-z][a-z0-9-]*\)\//,
    '',
  );
  if (normalizedFileName.startsWith('./')) {
    normalizedFileName = normalizedFileName.slice(2);
  }
  return normalizedFileName.replace(/\?.*$/, '');
};

const splitPathSegments = (path: string): string[] =>
  path.split(PATH_SEPARATOR_PATTERN).filter(Boolean);

export const isProjectSourceFrame = (fileName: string): boolean => {
  if (!isSourceFile(fileName)) {
    return false;
  }

  const normalizedFileName = normalizeSourceFilePath(fileName);
  const pathSegments = splitPathSegments(normalizedFileName);
  return (
    !pathSegments.includes('node_modules') &&
    !pathSegments.includes('.vite') &&
    !normalizedFileName.includes('/@vite/')
  );
};

export const isProjectOwnedFiber = async (fiber: Fiber): Promise<boolean> => {
  const source = await getSource(fiber).catch(() => null);
  return Boolean(source?.fileName && isProjectSourceFrame(source.fileName));
};
