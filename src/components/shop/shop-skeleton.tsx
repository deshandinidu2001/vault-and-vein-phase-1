import { Skeleton } from "@/components/ui/skeleton"

export function ShopSkeleton() {
  return <div role="status" aria-busy="true">
    <p className="sr-only">Loading stones…</p>
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => <div className="rounded-2xl border p-4" key={index}>
        <Skeleton className="aspect-[6/5] w-full bg-emerald/10 motion-reduce:animate-none" />
        <Skeleton className="mt-4 h-4 w-2/3 bg-emerald/10 motion-reduce:animate-none" />
        <Skeleton className="mt-3 h-4 w-1/2 bg-emerald/10 motion-reduce:animate-none" />
      </div>)}
    </div>
  </div>
}
