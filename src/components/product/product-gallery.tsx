"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GemArt } from "@/components/three/gem-art"
import { GemViewer } from "@/components/three/gem-viewer"
import type { Stone } from "@/types/stone"

const views = [
  { key: "face", label: "Face view" },
  { key: "profile", label: "Side view" },
  { key: "3d", label: "3D view" },
]

export function ProductGallery({ stone }: { stone: Stone }) {
  return <Tabs defaultValue="face" className="product-gallery gap-4">
    {views.map(({ key, label }) => <TabsContent value={key} key={key} className="stone-art min-w-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={label}>
      {key === "3d"
        ? <GemViewer cut={stone.model_key} tint={stone.tint} label={"Illustrative " + stone.cut.toLowerCase() + " cut model of " + stone.name} interactive />
        : <GemArt cut={stone.cut} tint={stone.tint} profile={key === "profile"} label={label + " illustration of " + stone.name} sizes="(min-width: 768px) 48vw, 95vw" />}
    </TabsContent>)}
    <TabsList aria-label="Stone views" className="product-view-tabs">
      {views.map(({ key, label }) => <TabsTrigger key={key} value={key} className="product-view-tab">{label}</TabsTrigger>)}
    </TabsList>
    <p className="text-sm text-muted-foreground">Illustrations show the cut and colour family. The 3D view uses a still illustration on mobile or when graphics support is limited.</p>
  </Tabs>
}
