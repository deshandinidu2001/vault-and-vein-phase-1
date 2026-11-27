export const site = {
  name: "Vault & Vein",
  tagline: "Rarity, Revealed.",
  descriptor: "Fine cut & polished gemstones",
  closing: "Every stone has a story. Discover yours.",
  description: "Discover fine cut and polished gemstones through a collection inspired by Sri Lankan gemstone heritage.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  country: "Sri Lanka",
  email: "vault8vein@gmail.com",
  mobile: "+94700000000",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  businessHours: "Every day, 8:00 AM to 5:00 PM (Sri Lanka time)",
  returnWindowDays: null as number | null,
  shippingNote: "Ask about delivery to your destination, available insurance and the full shipping cost before placing an order.",
  replyTime: "We reply within one business day.",
} as const

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export const gemLinks = [
  { href: "/shop?type=sapphire", label: "Sapphires", category: "sapphire" },
  { href: "/shop?type=spinel", label: "Spinel", category: "spinel" },
  { href: "/shop?type=garnet", label: "Garnet", category: "garnet" },
  { href: "/shop?collection=rare", label: "Rare finds", category: null },
]

export const returnNote = site.returnWindowDays === null
  ? "Ask us to confirm the return window, eligibility and return shipping terms in writing before placing an order."
  : "The return window is " + site.returnWindowDays + " days. Ask us to confirm eligibility and return shipping before ordering."

export const faq = [
  { question: "How do I buy a stone?", answer: "Add an available stone to your cart. If checkout is available, you can pay in LKR through PayHere for delivery within Sri Lanka. You can also ask us about a stone or your shortlist." },
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
    summary: "Your shortlist is stored in your browser so you can resume it later.",
    sections: [
      { heading: "Messages and checkout", body: "We use the contact and shipping details you submit to answer questions and process orders. PayHere handles payment details on its hosted checkout." },
      { heading: "External services", body: "When you use an external service such as WhatsApp or PayHere, that service’s privacy terms apply." },
    ],
  },
  terms: {
    title: "Terms",
    summary: "Review the price, availability and individual stone details before ordering.",
    sections: [
      { heading: "Questions and purchases", body: "If checkout is available, the order status page confirms when PayHere has verified payment. Before paying, confirm delivery and return terms for your order." },
    ],
  },
} as const

export type PolicyKey = keyof typeof policies
