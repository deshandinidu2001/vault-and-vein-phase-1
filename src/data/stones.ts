import type { Stone } from "@/types/stone"
import { gemModelCut } from "@/components/three/gem-shape"
import { sampleStones } from "./sample-stones"

export const mockStones: Stone[] = sampleStones.map((stone, index) => ({
  ...stone, id: "vv-" + String(index + 1).padStart(3, "0"), model_key: gemModelCut(stone.cut),
}))
