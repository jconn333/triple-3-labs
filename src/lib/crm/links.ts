/**
 * client_links.url must be something a browser can open. Dossier/code links
 * used to be stored as Mac paths (/Users/jeffconn/Dev/…), which the browser
 * resolved against triple3labs.io and 404'd. The write path (scripts/crm.mjs)
 * now rewrites known repo paths to GitHub; this guard keeps the UI from ever
 * rendering a non-web URL as an <a href>.
 */
export function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
