export type PhotoSlot = {
  src: string
  srcMobile: string
  alt: string
  origin: string
  mobileOrigin?: string
  zoom: number
}

export const sapphirePhoto = {
  src: "/images/hero/hero-01-sapphire.jpg",
  srcMobile: "/images/hero/hero-01-sapphire-mobile.jpg",
  alt: "A faceted blue sapphire catching the light",
}

function editorial(name: string, alt: string, origin: string, mobileOrigin = origin): PhotoSlot {
  const src = "/images/editorial/" + name + ".webp"
  return { src, srcMobile: src, alt, origin, mobileOrigin, zoom: 1 }
}

// Editorial illustrations of the collection themes, not photographs of listed stock.
export const editorialPhotos = {
  engagement: editorial("engagement", "A peach faceted gem beside a gold setting on evergreen velvet", "73% 50%"),
  rarities: editorial("rarities", "Teal and plum cut gemstones on dark slate", "73% 50%"),
  parcels: editorial("parcels", "Loose pink, wine and copper gems beside jeweller’s tweezers", "72% 52%"),
  cut: editorial("cut", "A golden faceted gemstone and a brass loupe on dark stone", "74% 49%"),
  bench: editorial("bench", "Rough and cut gemstones beside a loupe on a jeweller’s bench", "60% 50%"),
  care: editorial("care", "A blue sapphire on a folded cleaning cloth beside an evergreen pouch", "50% 58%"),
  closing: editorial("closing", "A teal gemstone in an open evergreen velvet presentation box", "50% 57%"),
}

export const photos = {
  collectionSapphire: { ...sapphirePhoto, origin: "72% 50%", zoom: 1.07 },
  collectionEngagement: editorialPhotos.engagement,
  collectionRare: { ...editorialPhotos.rarities, origin: "88% 50%", mobileOrigin: "91% 50%" },
  collectionParcels: { ...editorialPhotos.parcels, origin: "100% 52%", mobileOrigin: "94% 52%" },
  engagement: editorialPhotos.engagement,
  care: editorialPhotos.care,
  closing: editorialPhotos.closing,
  aboutHeritage: { ...sapphirePhoto, origin: "63% 47%", zoom: 1.08 },
  aboutCraft: editorialPhotos.bench,
} satisfies Record<string, PhotoSlot>
