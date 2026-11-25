import type { Stone } from "@/types/stone"

type Sample = Omit<Stone, "id" | "model_key">
export const sampleStones: Sample[] = [
  {
    slug: "monsoon-blue", name: "Monsoon Blue", gem_type: "sapphire", cut: "Oval", carat: 2.14,
    length_mm: 8.3, width_mm: 6.4, depth_mm: 4.2, colour: "Blue", clarity: "Eye clean",
    treatment: "Heated", origin: "Sri Lanka", description: "An oval with an even, rain-dark blue and flashes of lighter colour at its edges.",
    price_lkr: 385000, status: "available", is_featured: true, tint: "#3457a3", certified: true, collections: ["engagement"],
  },
  {
    slug: "lotus-dusk", name: "Lotus Dusk", gem_type: "sapphire", cut: "Cushion", carat: 1.58,
    length_mm: 7.1, width_mm: 6.3, depth_mm: 3.9, colour: "Pink orange", clarity: "Slightly included",
    treatment: "No treatment indicated in sample record", origin: "Sri Lanka", description: "A padparadscha-style cushion where soft pink moves into apricot.",
    price_lkr: 420000, status: "available", is_featured: true, tint: "#bd6d63", certified: true, collections: ["engagement"],
  },
  {
    slug: "mulberry-spinel", name: "Mulberry Spinel", gem_type: "spinel", cut: "Cushion", carat: 1.92,
    length_mm: 7.5, width_mm: 6.8, depth_mm: 4.2, colour: "Red", clarity: "Eye clean",
    treatment: "None indicated", origin: "Sri Lanka", description: "A berry-red cushion with bright reflections across a broad face.",
    price_lkr: 178000, status: "available", is_featured: true, tint: "#a83255", certified: false, collections: ["engagement", "parcels"],
  },
  {
    slug: "spiced-hessonite", name: "Spiced Hessonite", gem_type: "garnet", cut: "Oval", carat: 3.24,
    length_mm: 9.6, width_mm: 7.2, depth_mm: 5.1, colour: "Orange", clarity: "Moderately included",
    treatment: "None indicated", origin: "Sri Lanka", description: "A generous oval with a warm cinnamon centre and honeyed edges.",
    price_lkr: 89000, status: "available", is_featured: true, tint: "#a64b25", certified: false, collections: ["parcels"],
  },
  {
    slug: "two-lights", name: "Two Lights", gem_type: "alexandrite", cut: "Oval", carat: 1.12,
    length_mm: 6.7, width_mm: 5.2, depth_mm: 3.5, colour: "Colour change", clarity: "Slightly included",
    treatment: "None indicated", origin: "Sri Lanka", description: "An example of a colour-change oval, shifting from teal to a muted wine hue across different light.",
    price_lkr: 580000, status: "reserved", is_featured: true, tint: "#39776b", certified: true, collections: ["rare"],
  },
  {
    slug: "pale-gold", name: "Pale Gold", gem_type: "chrysoberyl", cut: "Emerald", carat: 2.46,
    length_mm: 8.5, width_mm: 6.1, depth_mm: 4.5, colour: "Yellow", clarity: "Eye clean",
    treatment: "None indicated", origin: "Sri Lanka", description: "Long step facets carry a light yellow colour through this rectangular cut.",
    price_lkr: 198000, status: "available", is_featured: true, tint: "#ab8d36", certified: true, collections: ["rare"],
  },
  {
    slug: "violet-hour", name: "Violet Hour", gem_type: "spinel", cut: "Round", carat: 1.34,
    length_mm: 6.6, width_mm: 6.6, depth_mm: 3.8, colour: "Violet", clarity: "Eye clean",
    treatment: "None indicated", origin: "Tanzania", description: "A round spinel with violet flashes and a cool, grey undertone.",
    price_lkr: 128000, status: "available", is_featured: true, tint: "#775a97", certified: false, collections: ["parcels"],
  },
  {
    slug: "forest-glass", name: "Forest Glass", gem_type: "garnet", cut: "Trillion", carat: 1.71,
    length_mm: 7.8, width_mm: 7.7, depth_mm: 4.1, colour: "Green", clarity: "Slightly included",
    treatment: "None indicated", origin: "Tanzania", description: "A green garnet with a triangular outline and sharp flashes of colour.",
    price_lkr: 168000, status: "available", is_featured: true, tint: "#3b884b", certified: false, collections: ["parcels"],
  },
  {
    slug: "island-teal", name: "Island Teal", gem_type: "sapphire", cut: "Pear", carat: 1.87,
    length_mm: 8.9, width_mm: 5.7, depth_mm: 4.1, colour: "Teal", clarity: "Slightly included",
    treatment: "Heated", origin: "Sri Lanka", description: "A long pear with a blue-green centre and a darker tip.",
    price_lkr: 265000, status: "available", is_featured: false, tint: "#25828a", certified: true, collections: ["engagement"],
  },
  {
    slug: "plum-ember", name: "Plum Ember", gem_type: "garnet", cut: "Cushion", carat: 2.63,
    length_mm: 8.1, width_mm: 7.4, depth_mm: 4.7, colour: "Red", clarity: "Eye clean",
    treatment: "None indicated", origin: "Tanzania", description: "A rhodolite-style cushion with plum tones and bright red facets.",
    price_lkr: 74000, status: "available", is_featured: false, tint: "#822f57", certified: false, collections: ["parcels"],
  },
  {
    slug: "silver-smoke", name: "Silver Smoke", gem_type: "spinel", cut: "Emerald", carat: 1.48,
    length_mm: 7.3, width_mm: 5.5, depth_mm: 3.8, colour: "Grey", clarity: "Eye clean",
    treatment: "None indicated", origin: "Sri Lanka", description: "A cool grey spinel with clear, architectural step facets.",
    price_lkr: 106000, status: "sold", is_featured: false, tint: "#717784", certified: false, collections: ["parcels"],
  },
  {
    slug: "morning-aureole", name: "Morning Aureole", gem_type: "chrysoberyl", cut: "Oval", carat: 1.36,
    length_mm: 6.8, width_mm: 5.5, depth_mm: 4.1, colour: "Yellow", clarity: "Slightly included",
    treatment: "None indicated", origin: "Sri Lanka", description: "A small oval with bright yellow facets around a softer centre.",
    price_lkr: 94000, status: "available", is_featured: false, tint: "#b69531", certified: false, collections: ["rare"],
  },
]
