export const FILE_LIMITS = {
  cover: 5 * 1024 * 1024,
  ebook: 200 * 1024 * 1024,
  zipImport: 200 * 1024 * 1024,
} as const;

export function mb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}
