import { sapphirePhoto, type PhotoSlot } from "./images"

export const heroDuration = 6000

export const heroSlides = [
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.02, origin: "74% 48%", mobileOrigin: "50% 18%", title: "Sapphires", caption: "From quiet blue to vivid shades of sunset.", href: "/shop?type=sapphire" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.13, origin: "89% 36%", mobileOrigin: "53% 10%", title: "Engagement stones", caption: "Find a colour you’ll want to wear every day.", href: "/shop?collection=engagement" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.24, origin: "65% 62%", mobileOrigin: "48% 26%", title: "Collector rarities", caption: "Consider colour change, unusual cuts and uncommon gems.", href: "/shop?collection=rare" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.17, origin: "81% 55%", mobileOrigin: "57% 22%", title: "Parcels for designers", caption: "Explore small groups of stones selected to work together.", href: "/shop?collection=parcels" },
  // TEMP: replace with real photo
  { ...sapphirePhoto, zoom: 1.09, origin: "60% 42%", mobileOrigin: "44% 14%", title: "Cut & polished in Sri Lanka", caption: "Meet the traditions that inform how we look at a stone.", href: "/about" },
] satisfies (PhotoSlot & { title: string; caption: string; href: string })[]
