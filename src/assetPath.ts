/**
 * Public-directory assets are referenced by hand as "/assets/..." throughout the data
 * and templates. That leading slash resolves against the domain root, which breaks
 * once the app is served from a subpath (e.g. GitHub Pages' /<repo>/ project sites).
 * Route every such reference through here so they honor Vite's configured `base`.
 */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
