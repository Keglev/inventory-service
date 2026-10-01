/**
 * @file HeroPreview.tsx
 * @module pages/home/sections/HeroPreview
 *
 * @summary
 * The landing hero's product screenshot, in the visitor's language and colour mode.
 *
 * @enterprise
 * - Four WebP variants (de/en x light/dark) at twice the displayed width. Only the
 *   variant matching the current language and mode is requested; a switch requests
 *   the new one then. Any language other than English gets German, the default.
 * - The width and height attributes carry the intrinsic size, so the browser reserves
 *   the box before the file arrives and nothing below it moves; a skeleton fills that
 *   box until the image has loaded.
 * - Load and error state are kept per source, so a variant switched in mid-load never
 *   inherits the previous variant's result.
 * - A failed load degrades to a text placeholder instead of a broken-image icon.
 *
 * @i18n
 * Uses the 'landing' namespace: hero.previewAlt, hero.previewFallback.
 */

import * as React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { previewSrc } from './heroPreviewSrc';

const WIDTH = 1116;
const HEIGHT = 641;

const HeroPreview: React.FC = () => {
  const { t, i18n } = useTranslation<'landing'>('landing');
  const src = previewSrc(i18n?.language, useTheme().palette.mode);
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  if (failedSrc === src) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 4 }}>
        {t('hero.previewFallback')}
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {loadedSrc !== src && (
        <Skeleton
          variant="rectangular"
          data-testid="hero-preview-skeleton"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
      {/* A plain img: on MUI Box, width and height are style props and never reach
          the element as the attributes that reserve its box. */}
      <img
        src={src}
        width={WIDTH}
        height={HEIGHT}
        alt={t('hero.previewAlt')}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    </Box>
  );
};

export default HeroPreview;
