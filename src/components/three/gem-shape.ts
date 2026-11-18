export type GemCut = "Oval" | "Cushion" | "Round" | "Emerald" | "Pear" | "Trillion"
export type GemStage = 0 | 1 | 2

const outlines: Partial<Record<GemCut, [number, number][]>> = {
  Emerald: [[-.58,-1],[.58,-1],[.81,-.77],[.81,.77],[.58,1],[-.58,1],[-.81,.77],[-.81,-.77]],
  Trillion: [[0,-1.16],[.47,-.61],[.93,.45],[.63,.72],[0,.82],[-.63,.72],[-.93,.45],[-.47,-.61]],
  Pear: [[0,-1.2],[.32,-.83],[.64,-.37],[.79,.18],[.62,.75],[0,.99],[-.62,.75],[-.79,.18],[-.64,-.37],[-.32,-.83]],
}

export function outline(cut: GemCut, stage: GemStage = 2): [number, number][] {
  if (stage === 0) return [[-.22,-1.1],[.48,-.94],[.89,-.5],[.66,-.08],[.94,.52],[.42,.91],[-.18,1.07],[-.73,.81],[-.86,.16],[-.63,-.55]]
  const shaped = outlines[cut]
  if (shaped) return shaped
  const count = 12
  return Array.from({ length: count }, (_, index) => {
    const angle = index / count * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle)
    const y = Math.sin(angle)
    const contour = cut === "Cushion" ? .73 : 1
    return [Math.sign(x) * Math.abs(x) ** contour * (cut === "Oval" ? .75 : 1), Math.sign(y) * Math.abs(y) ** contour]
  })
}

export function gemSvg(cut: GemCut, tint: string, stage: GemStage = 2, profile = false) {
  const points = outline(cut, stage)
  const hex = /^#[\da-f]{6}$/i.test(tint) ? tint : "#26735a"
  const point = (x: number, y: number) => (120 + x * 68).toFixed(1) + "," + (111 + y * 68).toFixed(1)
  const contour = points.map(([x,y]) => point(x,y)).join(" ")
  const table = points.map(([x,y]) => point(x * .56,y * .56)).join(" ")
  const facets = points.map(([x,y], index) => {
    const [nx,ny] = points[(index + 1) % points.length]
    const corners = [point(x,y),point(nx,ny),point(nx * .56,ny * .56),point(x * .56,y * .56)]
    const bright = index % 3 === 0
    return '<polygon points="' + corners.join(" ") + '" fill="' + (bright ? "#fff7e6" : "#05140e") + '" opacity="' + (bright ? ".34" : index % 2 ? ".35" : ".13") + '"/><path d="M' + corners[0] + " " + corners[2] + '" stroke="#fff7e6" stroke-opacity=".25"/>'
  }).join("")
  const face = '<polygon points="' + contour + '" fill="' + hex + '"/>' + facets + '<polygon points="' + table + '" fill="url(#glint)" stroke="#fff7e6" stroke-opacity=".35"/>'
  const side = '<path d="M45 106 74 77h92l29 29-75 61z" fill="' + hex + '"/><path d="M45 106h150m-121-29 18 29 28 61 27-61 19-29m-46 0v90" stroke="#fff7e6" stroke-opacity=".36" fill="none"/><path d="m45 106 75 61-28-61-18-29z" fill="#05140e" opacity=".28"/>'
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="glint" x2="1" y2="1"><stop stop-color="#fff7e6" stop-opacity=".56"/><stop offset=".7" stop-color="#fff7e6" stop-opacity="0"/></linearGradient><radialGradient id="shadow"><stop stop-color="#08140e" stop-opacity=".48"/><stop offset="1" stop-color="#08140e" stop-opacity="0"/></radialGradient></defs><ellipse cx="120" cy="204" rx="83" ry="12" fill="url(#shadow)"/>' + (profile ? side : face) + "</svg>"
}
