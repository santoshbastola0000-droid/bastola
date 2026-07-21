export const API_V1_PREFIX = "/api/v1";

export const apiV1Path = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath.startsWith(API_V1_PREFIX)) {
    return normalizedPath;
  }

  return `${API_V1_PREFIX}${normalizedPath}`;
};
