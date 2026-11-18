export const metadata = { title: "Store admin", robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="wrap section page-top">{children}</div>
}
