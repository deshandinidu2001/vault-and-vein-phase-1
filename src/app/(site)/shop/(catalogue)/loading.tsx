import { ShopSkeleton } from "@/components/shop/shop-skeleton"

export default function Loading() {
  return <div className="wrap wrap-editorial section page-top-compact space-y-10">
    <h1>Shop the stones.</h1>
    <ShopSkeleton />
  </div>
}
