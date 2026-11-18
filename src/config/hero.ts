import { sapphirePhoto, type PhotoSlot } from "./images"

export const heroSlides = [
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.02, origin: "74% 48%", mobileOrigin: "50% 18%", title: "Sapphires" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.13, origin: "89% 36%", mobileOrigin: "53% 10%", title: "Engagement stones" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.24, origin: "65% 62%", mobileOrigin: "48% 26%", title: "Collector rarities" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.17, origin: "81% 55%", mobileOrigin: "57% 22%", title: "Parcels for designers" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.09, origin: "60% 42%", mobileOrigin: "44% 14%", title: "Cut & polished in Sri Lanka" },
] satisfies (PhotoSlot & { title: string })[]
