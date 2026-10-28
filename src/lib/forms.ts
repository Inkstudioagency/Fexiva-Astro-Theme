import { PUBLIC_FORM_ENDPOINT } from 'astro:env/client';

/**
 * Form `action` used by every form in the theme.
 * Set PUBLIC_FORM_ENDPOINT (e.g. a Formspree, Basin or your own API URL) to receive submissions.
 * Without it the forms run in demo mode and show the success message without sending data.
 * A non-empty action also stops webflow.js from posting to Webflow's own form API.
 */
export const formAction = PUBLIC_FORM_ENDPOINT || '#';
