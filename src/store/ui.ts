import { create } from "zustand"

export type Currency = "LKR" | "USD"
export type EnquiryStone = { slug: string; name: string; gem_type: string }

type UiState = {
  currency: Currency
  toggleCurrency: () => void
  overlay: "cart" | "enquiry" | "menu" | null
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
  toggleCurrency: () => set(({ currency }) => ({ currency: currency === "LKR" ? "USD" : "LKR" })),
  overlay: null,
  enquiry: [],
  returnFocus: null,
  openCart: () => set({ overlay: "cart", returnFocus: focusedElement() }),
  openMenu: () => set({ overlay: "menu", returnFocus: focusedElement() }),
  openEnquiry: (stones = []) => set((state) => ({
    overlay: "enquiry", enquiry: stones,
    returnFocus: state.overlay ? state.returnFocus : focusedElement(),
  })),
  closeOverlay: () => set({ overlay: null }),
}))

export function restoreOverlayFocus(event: Event) {
  event.preventDefault()
  const { overlay, returnFocus } = useUi.getState()
  if (!overlay && returnFocus?.isConnected) returnFocus.focus()
}
