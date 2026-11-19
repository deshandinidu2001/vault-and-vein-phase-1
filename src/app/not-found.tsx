import SiteLayout from "./(site)/layout"
import SiteNotFound from "./(site)/not-found"

export default function NotFound() {
  return <SiteLayout><main id="main" tabIndex={-1}><SiteNotFound /></main></SiteLayout>
}
