"use client"

import dynamic from "next/dynamic"
import { useUi } from "@/store/ui"

const Cart = dynamic(() => import("./cart-sheet").then(module => module.CartSheet))
const Enquiry = dynamic(() => import("./enquiry-sheet").then(module => module.EnquirySheet))

export function StoreOverlays({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const cart = useUi(state => state.cartOpened)
  const enquiry = useUi(state => state.enquiryOpened)
  return <>{cart && <Cart paymentsEnabled={paymentsEnabled} />}{enquiry && <Enquiry />}</>
}
