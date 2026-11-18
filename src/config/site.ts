export const site = {
  name: "Vault & Vein",
  tagline: "Rarity, Revealed.",
  descriptor: "Fine cut & polished gemstones",
  closing: "Every stone has a story. Discover yours.",
  description: "Discover fine cut and polished gemstones through a collection inspired by Sri Lankan gemstone heritage.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  country: "Sri Lanka",
  mapEmbedUrl: "https://maps.google.com/maps?q=Sri%20Lanka&z=7&output=embed",
  email: "",
  whatsappNumber: "",
  businessHours: "",
  returnWindowDays: null as number | null,
  shippingNote: "Ask about delivery to your destination, available insurance and the full shipping cost before placing an order.",
  replyTime: "We reply within one business day.",
  // Illustrative conversion for Phase 1, expressed as LKR per USD.
  lkrPerUsd: 300,
} as const

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export const gemLinks = [
  { href: "/shop?type=sapphire", label: "Sapphires" },
  { href: "/shop?type=spinel", label: "Spinel" },
  { href: "/shop?type=garnet", label: "Garnet" },
  { href: "/shop?collection=rare", label: "Rare finds" },
]

export const returnNote = site.returnWindowDays === null
  ? "Ask us to confirm the return window, eligibility and return shipping terms in writing before placing an order."
  : "The return window is " + site.returnWindowDays + " days. Ask us to confirm eligibility and return shipping before ordering."

export const faq = [
  { question: "How do I buy a stone?", answer: "Open a listing and enquire about it, or request several stones together from your cart. An enquiry is the start of a conversation about availability, the stone and delivery." },
  { question: "Are the stones certified?", answer: "We indicate when a lab report is available. Ask to see the report for the individual stone and review its findings before deciding." },
  { question: "How do shipping and insurance work?", answer: site.shippingNote },
  { question: "What is the returns policy?", answer: returnNote },
  { question: "Are stones natural or treated?", answer: "Natural origin and treatment are separate questions. Review the stone’s treatment disclosure and any available lab report, and ask us to clarify anything that is uncertain." },
]

export function whatsappLink(message: string) {
  const digits = site.whatsappNumber.replace(/\D/g, "")
  return digits ? "https://wa.me/" + digits + "?text=" + encodeURIComponent(message) : undefined
}
// Store policy drafts for the sample storefront.
export const policies = {
  shipping: {
    title: "Shipping",
    summary: site.shippingNote,
    sections: [
      { heading: "Before dispatch", body: "Ask us about shipping options, packaging, tracking, insurance coverage and any restrictions for the destination. Confirm these details with us before ordering." },
      { heading: "International delivery", body: "Duties, taxes, customs checks and delivery availability can vary by destination. Ask what is included in a quote and what you may need to arrange separately." },
    ],
  },
  returns: {
    title: "Returns",
    summary: returnNote,
    sections: [
      { heading: "Before returning a stone", body: "Contact us first. Confirm how to pack and send the stone, whether original documents are needed and who will arrange return delivery." },
      { heading: "When there is a problem", body: "If something arrives damaged or differs from what you expected, keep the package and any documents so we can understand what happened." },
    ],
  },
  privacy: {
    title: "Privacy",
    summary: "This preview keeps your shortlist in your browser and lets you try the enquiry and contact forms.",
    sections: [
      { heading: "Preview forms and cart", body: "The forms validate details on this site without transmitting the submitted form data. The cart uses browser storage so the shortlist can be restored when you return." },
      { heading: "External services", body: "The contact map is provided by Google Maps. If you follow an external link or use its services, that provider’s privacy terms apply." },
    ],
  },
  terms: {
    title: "Terms",
    summary: "Vault & Vein’s Phase 1 site presents a sample catalogue for browsing.",
    sections: [
      { heading: "Illustrative listings", body: "Names, prices, report flags and availability are examples. Images and 3D models illustrate the cut and colour family. They are not records of individual stones offered for sale." },
      { heading: "Enquiries and purchases", body: "The preview does not accept payment or confirm orders. Before agreeing to any future purchase, review the individual stone, price, availability and written delivery and return terms." },
    ],
  },
} as const

export type PolicyKey = keyof typeof policies
