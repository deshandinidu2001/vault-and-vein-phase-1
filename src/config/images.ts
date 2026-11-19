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
}

export const photos = {
  collectionSapphire: { ...sapphirePhoto, origin: "72% 50%", zoom: 1.07 },
  collectionEngagement: editorialPhotos.engagement,
  collectionRare: { ...editorialPhotos.rarities, origin: "88% 50%", mobileOrigin: "91% 50%" },
  collectionParcels: { ...editorialPhotos.parcels, origin: "100% 52%", mobileOrigin: "94% 52%" },
  engagement: {
    src: "/images/editorial/The engagement edit.jpg",
    srcMobile: "/images/editorial/The engagement edit.jpg",
    alt: "A peach faceted gemstone beside a gold ring in warm light",
    origin: "51% 57%",
    mobileOrigin: "52% 57%",
    zoom: 1.09,
  },
  care: {
    src: "/images/editorial/after the sale.jpg",
    srcMobile: "/images/editorial/after the sale.jpg",
    alt: "A blue sapphire on a soft cloth beside an evergreen pouch",
    origin: "63% 51%",
    mobileOrigin: "82% 52%",
    zoom: 1,
  },
  closing: {
    src: "/images/editorial/make time for a stone.jpg",
    srcMobile: "/images/editorial/make time for a stone.jpg",
    alt: "",
    origin: "56% 51%",
    mobileOrigin: "73% 50%",
    zoom: 1,
  },
  aboutHeritage: { ...sapphirePhoto, origin: "63% 47%", zoom: 1.08 },
} satisfies Record<string, PhotoSlot>
