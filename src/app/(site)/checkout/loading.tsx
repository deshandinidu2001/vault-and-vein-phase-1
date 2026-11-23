import { PageLoading } from "@/components/layout/page-loading"

export default function Loading() {
  return <div className="wrap section page-top">
    <PageLoading label="Loading checkout…" />
  </div>
}
