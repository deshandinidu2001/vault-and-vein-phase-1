import { create } from "zustand"
import type { UsdRate } from "@/lib/pricing"

export type Currency = "LKR" | "USD"
export type EnquiryStone = { slug: string; name: string; gem_type: string }

type UiState = {
  currency: Currency
  usdRate: UsdRate | null
  toggleCurrency: () => void
  overlay: "cart" | "enquiry" | "menu" | null
  menuOpened: boolean
  cartOpened: boolean
  enquiryOpened: boolean
  enquiry: EnquiryStone[]
  returnFocus: HTMLElement | null
  openCart: () => void
  openMenu: () => void
  openEnquiry: (stones?: EnquiryStone[]) => void
  closeOverlay: () => void
}

function focusedElement() {
  return typeof document !== "undefined" && document.activeElement instanceof HTMLElement
    ? document.activeElement : null
}

export const useUi = create<UiState>((set) => ({
  currency: "LKR",
  usdRate: null,
  toggleCurrency: () => set(({ currency }) => ({ currency: currency === "LKR" ? "USD" : "LKR" })),
  overlay: null,
  menuOpened: false,
  cartOpened: false,
  enquiryOpened: false,
  enquiry: [],
  returnFocus: null,
  openCart: () => set({ overlay: "cart", cartOpened: true, returnFocus: focusedElement() }),
  openMenu: () => set({ overlay: "menu", menuOpened: true, returnFocus: focusedElement() }),
  openEnquiry: (stones = []) => set((state) => ({
    overlay: "enquiry", enquiryOpened: true, enquiry: stones,
    returnFocus: state.overlay ? state.returnFocus : focusedElement(),
  })),
  closeOverlay: () => set({ overlay: null }),
}))

export function restoreOverlayFocus(event: Event) {
  event.preventDefault()
  const { overlay, returnFocus } = useUi.getState()
  if (!overlay && returnFocus?.isConnected) returnFocus.focus()
}
