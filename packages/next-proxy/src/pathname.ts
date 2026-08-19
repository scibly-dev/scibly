function normalizeRoutePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "") || "/";
}

export function pathnameMatchesRoute(
  pathname: string,
  routePathname: string,
): boolean {
  const normalizedPathname = normalizeRoutePathname(pathname);
  const normalizedRoute = normalizeRoutePathname(routePathname);

  if (normalizedRoute === "/") {
    return normalizedPathname === normalizedRoute;
  }

  return (
    normalizedPathname === normalizedRoute ||
    normalizedPathname.startsWith(`${normalizedRoute}/`)
  );
}
