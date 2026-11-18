export type PhotoSlot = {
  src: string
  srcMobile: string
  alt: string
  origin: string
  mobileOrigin?: string
  zoom: number
}

// TEMP: replace with real photo in each slot.
export const sapphirePhoto = {
  src: "/images/hero/hero-01-sapphire.jpg",
  srcMobile: "/images/hero/hero-01-sapphire-mobile.jpg",
  alt: "A faceted blue sapphire catching the light",
}

export const photos = {
  // TEMP: replace with real photo
  collectionSapphire: { ...sapphirePhoto, origin: "72% 50%", zoom: 1.07 },
  // TEMP: replace with real photo
  collectionEngagement: { ...sapphirePhoto, origin: "86% 40%", zoom: 1.16 },
  // TEMP: replace with real photo
  collectionRare: { ...sapphirePhoto, origin: "64% 63%", zoom: 1.23 },
  // TEMP: replace with real photo
  collectionParcels: { ...sapphirePhoto, origin: "77% 57%", zoom: 1.11 },
  // TEMP: replace with real photo
  engagement: { ...sapphirePhoto, origin: "89% 44%", zoom: 1.14 },
  // TEMP: replace with real photo
  care: { ...sapphirePhoto, origin: "68% 55%", zoom: 1.21 },
  // TEMP: replace with real photo
  closing: { ...sapphirePhoto, origin: "84% 60%", zoom: 1.18 },
  // TEMP: replace with real photo
  aboutHeritage: { ...sapphirePhoto, origin: "63% 47%", zoom: 1.08 },
  // TEMP: replace with real photo
  aboutCraft: { ...sapphirePhoto, origin: "81% 64%", zoom: 1.24 },
} satisfies Record<string, PhotoSlot>
