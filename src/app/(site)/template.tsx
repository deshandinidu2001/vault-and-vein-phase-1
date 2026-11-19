export default function PageTemplate({ children }: { children: React.ReactNode }) {
  return <main id="main" tabIndex={-1} className="store-page">{children}</main>
}
