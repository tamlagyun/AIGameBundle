export interface PlaceholderArtManifest {
  background: string;
  branchPile: string;
  thatchPile: string;
  mushroom: string;
}

const PLACEHOLDER_ART_MANIFEST: PlaceholderArtManifest = {
  background: 'art/placeholder/forest-background',
  branchPile: 'art/placeholder/branch-pile',
  thatchPile: 'art/placeholder/thatch-pile',
  mushroom: 'art/placeholder/mushroom'
};

export function getPlaceholderArtManifest(): PlaceholderArtManifest {
  return { ...PLACEHOLDER_ART_MANIFEST };
}
