/** Normalises a pathname so "/about/" and "/about" compare equal. */
const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

/** Mirrors Webflow's `w--current` rule: a link is current when it points at the page being viewed. */
export function isCurrent(href: string, pathname: string): boolean {
  return normalize(href) === normalize(pathname);
}
