/** An absolute address on the site: the base URL without its trailing slash, then the path. */
export const siteUrl = (baseUrl: string, path: string) =>
  `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`
