import { editorialPhotos, sapphirePhoto, type PhotoSlot } from "./images"

export const heroSlides = [
  { ...sapphirePhoto, zoom: 1.02, origin: "74% 48%", mobileOrigin: "50% 18%", title: "Sapphires" },
  { ...editorialPhotos.engagement, title: "Engagement stones" },
  { ...editorialPhotos.rarities, title: "Collector rarities" },
  { ...editorialPhotos.parcels, title: "Parcels for designers" },
  { ...editorialPhotos.cut, title: "Cut & polished in Sri Lanka" },
] satisfies (PhotoSlot & { title: string })[]
