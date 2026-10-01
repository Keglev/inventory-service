/**
 * @file heroPreviewSrc.ts
 * @module pages/home/sections/heroPreviewSrc
 *
 * @summary
 * Public path of the landing hero's screenshot for a language and colour mode. Only
 * English has its own variant; every other language gets German, the default.
 */

export function previewSrc(language: string | undefined, mode: 'light' | 'dark'): string {
  const lang = language?.toLowerCase().startsWith('en') ? 'en' : 'de';
  return `${import.meta.env.BASE_URL}images/hero-${lang}-${mode}.webp`;
}
