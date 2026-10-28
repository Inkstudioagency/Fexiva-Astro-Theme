/**
 * Global site configuration.
 * Edit this file to rebrand the theme: name, SEO defaults, navigation,
 * footer links, social profiles and form endpoints all live here.
 */

export const site = {
  name: 'Fexiva',
  /** Appended to page titles: "About | Fexiva - Astro Theme" */
  titleSuffix: 'Fexiva - Astro Theme',
  description:
    'Manage expenses, track spend, and unlock financial clarity—all in one place. Real-time analytics, worldwide transactions, and smart budgeting for growing teams.',
  /** Default Open Graph / Twitter image (path inside /public). */
  ogImage: '/images/open-graph-image.webp',
  /** Webflow site id. Kept for parity with the original markup (not used for form posting). */
  wfSiteId: '6aa7a9e9eb79fb41eaaa8184',
  copyright: `© ${new Date().getFullYear()} Fexiva. All rights reserved.`,
  credits: [
    { label: 'Ink Studio', href: 'https://inks.studio/', prefix: 'Designed by ' },
    { label: 'Astro', href: 'https://astro.build', prefix: ' · Powered by ' },
  ],
};

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
];

export const navCta = { label: 'Get started', href: '/contact' };

export const footerColumns = [
  {
    title: 'Main pages',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/features' },
      { label: 'About ', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Others pages',
    // Webflow grid-area id kept so the original grid placement CSS still applies.
    id: 'w-node-_8e6f91ed-67d1-b81a-cd55-ae0825093dc5-25093db0',
    links: [
      { label: 'Integrations', href: '/integrations' },
      { label: 'Blog Details', href: '/blog/building-a-security-culture-your-finance-team-will-own' },
      { label: 'Integrations Details', href: '/integrations/umbrella-insights' },
      { label: 'Instructions', href: '/instructions' },
    ],
  },
  {
    title: 'Utility Pages',
    links: [
      { label: 'Style Guide', href: '/style-guide' },
      { label: 'Licenses', href: '/licenses' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Password', href: '/401' },
      { label: 'Not Found', href: '/404' },
    ],
  },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: '/images/icon-facebook.svg' },
  { label: 'X', href: 'https://x.com', icon: '/images/icon-x.svg' },
  { label: 'Instagram', href: 'https://instagram.com', icon: '/images/icon-instagram.svg' },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: '/images/icon-linkedin.svg' },
];

/** Blog category tabs on /blog, in display order. Values must match the Strapi enum. */
export const blogCategories = ['Fintech', 'Product', 'Security', 'Company'] as const;
