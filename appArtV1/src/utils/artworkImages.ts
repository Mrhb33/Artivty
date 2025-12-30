import type { ImageSourcePropType } from 'react-native';
import type { Artwork, ArtworkImages } from '../types/api';

export type ArtworkImageVariant = 'feed' | 'thumb' | 'square' | 'original';

const toImageSource = (value?: string | ImageSourcePropType): ImageSourcePropType | undefined => {
  if (!value) {
    return undefined;
  }
  return typeof value === 'string' ? { uri: value } : value;
};

const selectVariant = (images: ArtworkImages | undefined, variant: ArtworkImageVariant) => {
  if (!images) return undefined;
  switch (variant) {
    case 'feed':
      return images.feedUrl;
    case 'thumb':
      return images.thumbUrl;
    case 'square':
      return images.squareUrl;
    case 'original':
      return images.originalUrl;
  }
};

export const getArtworkImageSource = (artwork: Artwork, variant: ArtworkImageVariant): ImageSourcePropType | undefined => {
  const direct = selectVariant(artwork.images, variant);
  if (direct) {
    return toImageSource(direct);
  }

  const fallbackOrder = [
    artwork.images?.feedUrl,
    artwork.images?.squareUrl,
    artwork.image_url,
    artwork.images?.thumbUrl,
    artwork.images?.originalUrl,
  ];

  for (const candidate of fallbackOrder) {
    const resolved = toImageSource(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return undefined;
};
