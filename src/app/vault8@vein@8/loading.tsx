import { PageLoading } from "@/components/layout/page-loading"

export default function Loading() {
  return <div className="admin-panel p-6">
    <PageLoading label="Loading store admin…" />
  </div>
}
