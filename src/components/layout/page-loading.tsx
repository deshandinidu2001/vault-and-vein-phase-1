import { Skeleton } from "@/components/ui/skeleton"

export function PageLoading({ label }: { label: string }) {
  return <div role="status" aria-busy="true" className="grid gap-6">
    <p className="text-sm font-semibold">{label}</p>
    <div aria-hidden="true" className="grid gap-4">
      <Skeleton className="h-12 w-2/3 max-w-96 motion-reduce:animate-none" />
      <Skeleton className="h-4 w-4/5 max-w-lg motion-reduce:animate-none" />
      <Skeleton className="h-4 w-3/5 max-w-sm motion-reduce:animate-none" />
      <Skeleton className="mt-4 h-40 w-full rounded-2xl motion-reduce:animate-none" />
    </div>
  </div>
}
