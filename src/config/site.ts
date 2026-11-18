export const site = {
  name: "Vault & Vein",
  tagline: "Rarity, Revealed.",
  descriptor: "Fine cut & polished gemstones",
  closing: "Every stone has a story. Discover yours.",
  description: "Discover fine cut and polished gemstones through a collection inspired by Sri Lankan gemstone heritage.",
  country: "Sri Lanka",
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
