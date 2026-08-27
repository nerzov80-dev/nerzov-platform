export function getLandingPageSlug(
  pathname: string,
): string | null {
  const match = pathname.match(/^\/lp\/([^/]+)$/);

  if (!match) return null;

  return decodeURIComponent(match[1]);
}
