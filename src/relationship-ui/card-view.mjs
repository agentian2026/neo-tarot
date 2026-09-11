import { resolveAssetSnapshot } from '../card-assets/selector.mjs';

export function getCardDisplayModel(assetSelection, imageStatus = 'pending') {
  const asset = resolveAssetSnapshot(assetSelection);
  const showImage = Boolean(asset) && imageStatus === 'loaded';
  return Object.freeze({
    asset,
    image_src: asset?.path ?? null,
    show_image: showImage,
    show_generic_fallback: !showImage,
  });
}
