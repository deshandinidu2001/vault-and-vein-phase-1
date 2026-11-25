import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const routes = ["/", "/shop", "/about", "/contact", "/shipping", "/returns", "/privacy", "/terms", "/checkout"]

test.beforeEach(async ({ page }) => {
  await page.route("https://maps.google.com/**", (route) => route.abort())
})

test("hero slide controls, empty gallery and a keyboard-operable FAQ", async ({ page, isMobile }) => {
  await page.goto("/")
  const dots = page.getByRole("group", { name: "Choose an image" })
  await expect(dots.getByRole("button")).toHaveCount(5)
  const first = dots.getByRole("button", { name: /Show image 1 of 5/ })
  await expect(first).toHaveAttribute("aria-pressed", "false", { timeout: 7000 })
  if (!isMobile) {
    await page.locator(".hero-art").hover({ position: { x: 950, y: 160 } })
    const selection = await dots.locator("[aria-pressed=true]").getAttribute("aria-label")
    await page.waitForTimeout(1650)
    await expect(dots.locator("[aria-pressed=true]")).toHaveAttribute("aria-label", selection!)
    await page.mouse.move(2, 2)
    await expect(dots.locator("[aria-pressed=true]")).not.toHaveAttribute("aria-label", selection!)
  }
  const third = dots.getByRole("button", { name: /Show image 3 of 5/ })
  await third.click()
  await expect(third).toHaveAttribute("aria-pressed", "true")
  if (!isMobile) {
    await third.press("ArrowRight")
    await expect(dots.getByRole("button", { name: /Show image 4 of 5/ })).toBeFocused()
    const enquiryButton = page.locator(".hero-actions").getByRole("button", { name: "Ask about a stone" })
    await expect(enquiryButton).toHaveCSS("color", "rgb(246, 241, 231)")
    await enquiryButton.hover()
    await expect(enquiryButton).toHaveCSS("color", "rgb(239, 215, 159)")
    await expect(enquiryButton).toHaveCSS("background-color", "rgb(11, 61, 46)")
  }

  const gallery = page.locator("#gallery")
  await expect(gallery.getByText("New listings will appear here.", { exact: false })).toBeVisible()
  await expect(gallery.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact")

  const faq = page.getByRole("button", { name: "How do I buy a stone?" })
  await faq.press("Enter")
  await expect(faq).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("Add an available stone to your cart.", { exact: false })).toBeVisible()
})

test("collection advances horizontally with the section pinned on desktop", async ({ page, isMobile }) => {
  await page.goto("/")
  const track = page.getByRole("list", { name: "Collection edits" })
  await expect(track.getByRole("listitem")).toHaveCount(4)
  if (isMobile) {
    await page.getByRole("button", { name: "Next collection" }).click()
    await expect.poll(() => track.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100)
  } else {
    await expect(track).toHaveAttribute("data-scroll-driven", "true")
    await page.locator(".collection-panel").evaluate((node) => {
      const entry = node.getBoundingClientRect().top + scrollY - 86
      window.scrollTo({ top: entry + 180, behavior: "instant" })
    })
    await expect.poll(() => track.evaluate((node) => node.scrollLeft)).toBeGreaterThan(40)
    const position = await page.locator(".collection-panel").evaluate((node) => node.getBoundingClientRect().top)
    expect(position).toBeGreaterThan(83)
    expect(position).toBeLessThan(89)
  }
})

test("shop filters and empty catalogue states", async ({ page, request }) => {
  await page.goto("/shop")
  const search = page.getByRole("searchbox", { name: "Search the catalogue" })
  await expect(search).toHaveCount(1)
  await expect(page.getByText("No stones are listed right now.")).toBeVisible()
  await expect(page.locator("#results li")).toHaveCount(0)
  await expect(page.getByRole("navigation", { name: "Catalogue pages" })).toHaveCount(0)

  await search.fill("does not exist")
  await page.getByRole("button", { name: "Apply filters" }).click()
  await expect(page.getByText("No stones match these filters.")).toBeVisible()
  await page.getByRole("link", { name: "Clear filters" }).last().click()
  await expect(page.getByText("No stones are listed right now.")).toBeVisible()
  const filters = page.getByRole("button", { name: "Filters", exact: true })
  await filters.click()
  await expect(filters).toHaveAttribute("aria-expanded", "true")
  await page.getByLabel("Gem type").selectOption("sapphire")
  await page.getByRole("button", { name: "Apply filters" }).click()
  await expect(page).toHaveURL(/type=sapphire/)
  await expect(page.getByText("No stones match these filters.")).toBeVisible()
  expect((await request.get("/shop/silver-smoke")).status()).toBe(404)
})

test("old sample cart entries are removed", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("vault-and-vein-cart", JSON.stringify({
      state: { items: [{ id: "vv-001", slug: "monsoon-blue", name: "Monsoon Blue", is_sample: true }] },
      version: 0,
    }))
  })
  await page.goto("/shop")
  const cart = page.getByRole("dialog", { name: "Your cart" })
  await expect(async () => {
    if (!await cart.isVisible()) await page.getByRole("button", { name: "Open cart, 0 stones" }).click()
    await expect(cart.getByText("Your cart is empty.")).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 10000 })
  await expect(cart.getByText("Monsoon Blue")).toHaveCount(0)
})

test("contact validation and submission, admin guard and safe preview checkout", async ({ page, request }) => {
  await page.goto("/contact")
  await expect(page.getByRole("link", { name: "vault8vein@gmail.com" })).toHaveAttribute("href", "mailto:vault8vein@gmail.com")
  const intro = await page.getByRole("main").getByText("Contact", { exact: true }).boundingBox()
  const header = await page.locator(".header-row").boundingBox()
  expect(intro!.y - header!.height).toBeLessThan(60)
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.getByText("Enter your name.")).toBeVisible()
  await page.getByLabel("Name", { exact: true }).fill("Test Visitor")
  await page.getByLabel("Email", { exact: true }).fill("test@example.test")
  await page.getByLabel("Subject", { exact: true }).fill("A stone enquiry")
  await page.getByLabel("Message", { exact: true }).fill("Can you share more about this stone?")
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.getByText("Preview complete. Your message was not sent.")).toBeVisible()

  for (const route of ["/vault8@vein@8", "/vault8@vein@8?view=orders", "/vault8@vein@8?view=inbox", "/vault8@vein@8/products/new"]) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/vault8@vein@8\/login$/)
    await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible()
    await expect(page.locator(".site-footer")).toHaveCount(0)
  }
  await page.goto("/checkout")
  await expect(page.getByText("Online payment is currently unavailable.", { exact: false })).toBeVisible()
  expect((await request.post("/api/checkout", { data: {} })).status()).toBe(503)
  expect((await request.post("/api/payhere/notify", { form: {} })).status()).toBe(503)
  for (const route of ["/api/contact", "/api/enquiry"]) {
    expect((await request.post(route, { headers: { "sec-fetch-site": "cross-site" }, data: {} })).status()).toBe(403)
    expect((await request.post(route, { data: {} })).status()).toBe(400)
  }
  expect((await request.get("/order/7a13082e-18aa-4a07-8300-8d617943aef3")).status()).toBe(404)
})

async function scrollPastWordmarkReveal(page: Page, offset: number) {
  await page.evaluate(async (distance) => {
    const mark = document.querySelector<HTMLElement>(".footer-wordmark")!
    const footer = document.querySelector<HTMLElement>(".site-footer")!
    const box = mark.getBoundingClientRect()
    const sticky = getComputedStyle(footer).position === "sticky"
    const remainingReveal = sticky ? footer.previousElementSibling!.getBoundingClientRect().bottom - box.top : box.bottom - innerHeight
    window.scrollTo({ top: scrollY + remainingReveal + distance, behavior: "instant" })
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }, offset)
}

test("footer wordmark fills after it is fully revealed across public pages", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route)
    // Catalogue results stream after the page shell and change the footer's position.
    if (route === "/shop") await expect(page.getByText("No stones are listed right now.")).toBeVisible()
    const wordmark = page.locator(".footer-wordmark")
    await expect(wordmark).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
    const fill = () => wordmark.evaluate((node) => node.style.getPropertyValue("--footer-fill"))
    await expect.poll(fill, { message: route }).toBe("0.00%")
    await expect(page.locator(".site-footer")).toHaveCSS("position", "sticky")
    await scrollPastWordmarkReveal(page, -30)
    expect(await fill(), route).toBe("0.00%")
    await scrollPastWordmarkReveal(page, 6)
    expect(await fill(), route).toBe("0.00%")
    await scrollPastWordmarkReveal(page, 44)
    const duringFill = parseFloat(await fill())
    expect(duringFill, route).toBeGreaterThan(20)
    expect(duringFill, route).toBeLessThan(90)
    await expect(wordmark.locator(".footer-wordmark-fill")).toHaveCSS("transition-duration", "1.2s")
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }))
    await expect.poll(() => wordmark.evaluate((node) => node.style.getPropertyValue("--footer-fill")), { message: route }).toBe("100.00%")
  }
})

test("About matches the editorial layout, navigation and responsive accessibility", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  if (isMobile) await page.getByRole("button", { name: "Open menu" }).click()
  const navigation = page.getByRole("navigation", { name: isMobile ? "Mobile navigation" : "Main navigation" })
  await navigation.getByRole("link", { name: "About" }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole("heading", { name: "Formed by colour." })).toBeVisible()
  await expect(page.locator(".home-masthead .hero-panel")).toBeVisible()
  await expect(page.locator("#care")).toBeAttached()
  const process = page.locator("section").filter({ has: page.getByRole("heading", { name: "The work in every facet." }) })
  await expect(process.locator("img")).toHaveCount(0)

  for (const url of ["/", "/about", "/shop", "/contact", "/checkout", "/vault8@vein@8/login"]) {
    await page.goto(url)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), url).toBeLessThanOrEqual(1)
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
    expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.flatMap(({ target }) => target) })), url).toEqual([])
  }
})

test("shop and policy links, document fragments, sitemap and missing pages", async ({ page, request, baseURL, isMobile }) => {
  test.skip(isMobile, "Both layouts use the same route and fragment targets.")
  const sources = [...routes, "/shop?page=2"]
  const internal = new Set<string>()
  for (const route of sources) {
    await page.goto(route)
    const anchors = await page.locator("a[href]").evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))
    for (const href of anchors) {
      const url = new URL(href)
      if (url.origin === baseURL) internal.add(url.pathname + url.search + url.hash)
    }
  }
  const documents = new Map<string, string>()
  for (const href of internal) {
    const [path, hash] = href.split("#")
    if (!documents.has(path)) {
      const response = await request.get(path)
      expect(response.status(), href).toBe(200)
      documents.set(path, await response.text())
    }
    if (hash) expect(documents.get(path), href).toContain('id="' + decodeURIComponent(hash) + '"')
  }
  const map = await request.get("/sitemap.xml")
  expect(map.status()).toBe(200)
  expect(await map.text()).not.toContain("/shop/monsoon-blue</loc>")
  expect((await request.get("/robots.txt")).status()).toBe(200)
  expect((await request.get("/images/stones/monsoon-blue")).status()).toBe(404)
  expect((await request.get("/shop/does-not-exist")).status()).toBe(404)
})
