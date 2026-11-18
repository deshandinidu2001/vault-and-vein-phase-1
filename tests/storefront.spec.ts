import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const product = "/shop/monsoon-blue"
const routes = ["/", "/shop", "/about", "/contact", "/shipping", "/returns", "/privacy", "/terms", product, "/checkout", "/admin/login"]

test.beforeEach(async ({ page }) => {
  await page.route("https://maps.google.com/**", (route) => route.abort())
})

test("hero slide controls, gallery filtering and a keyboard-operable FAQ", async ({ page, isMobile }) => {
  await page.goto("/")
  const dots = page.getByRole("group", { name: "Choose an image" })
  await expect(dots.getByRole("button")).toHaveCount(5)
  const first = dots.getByRole("button", { name: /Show image 1 of 5/ })
  await expect(first).toHaveAttribute("aria-pressed", "false", { timeout: 7000 })
  const third = dots.getByRole("button", { name: /Show image 3 of 5/ })
  await third.click()
  await expect(third).toHaveAttribute("aria-pressed", "true")
  if (!isMobile) {
    await third.press("ArrowRight")
    await expect(dots.getByRole("button", { name: /Show image 4 of 5/ })).toBeFocused()
    const enquiryButton = page.locator(".hero-actions").getByRole("button", { name: "Enquire about a stone" })
    await expect(enquiryButton).toHaveCSS("color", "rgb(246, 241, 231)")
    await enquiryButton.hover()
    await expect(enquiryButton).toHaveCSS("color", "rgb(6, 37, 28)")
    await expect(enquiryButton).toHaveCSS("background-color", "rgb(246, 241, 231)")
  }

  const gallery = page.locator("#gallery")
  await gallery.getByRole("radio", { name: "Spinel" }).click()
  const open = gallery.getByRole("button", { name: "Open this stone: Mulberry Spinel" })
  await open.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "Mulberry Spinel" })).toBeVisible()
  await dialog.getByRole("button", { name: "Next stone" }).click()
  await expect(dialog.getByRole("heading", { name: "Mulberry Spinel" })).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  await expect(gallery.getByRole("link", { name: "Explore more in the shop" })).toHaveAttribute("href", "/shop?type=spinel")

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

test("shop search, filters, sort, empty states and pagination", async ({ page }) => {
  await page.goto("/shop")
  const search = page.getByRole("searchbox", { name: "Search the catalogue" })
  await expect(search).toHaveCount(1)
  await expect(page.locator("#results li")).toHaveCount(8)
  await page.getByRole("link", { name: "Next", exact: true }).click()
  await expect(page).toHaveURL(/page=2#results/)
  await expect(page.locator("#results li")).toHaveCount(4)
  await search.fill("does not exist")
  await page.getByRole("button", { name: "Apply filters" }).click()
  await expect(page.getByText("No stones match these filters.")).toBeVisible()
  await page.getByRole("link", { name: "Clear filters" }).last().click()
  await page.getByRole("button", { name: "Filters", exact: true }).click()
  await page.getByLabel("Gem type").selectOption("sapphire")
  await page.getByLabel("Sort by").selectOption("price-asc")
  await page.getByRole("button", { name: "Apply filters" }).click()
  await expect(page).toHaveURL(/type=sapphire/)
  const results = page.locator("#results article")
  await expect(results).toHaveCount(3)
  const prices = await results.locator(".tabular-nums").allTextContents()
  const lkr = prices.map((value) => Number(value.replace(/[^0-9]/g, "")))
  expect(lkr).toEqual([...lkr].sort((a, b) => a - b))
})

test("product buttons have distinct face, side and 3D targets", async ({ page }) => {
  await page.goto(product)
  const face = page.getByRole("tab", { name: "Face view" })
  const side = page.getByRole("tab", { name: "Side view" })
  const model = page.getByRole("tab", { name: "3D view" })
  await expect(face).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("img", { name: "Face view illustration of Monsoon Blue" })).toBeVisible()
  const boxes = await Promise.all([face, side, model].map((tab) => tab.boundingBox()))
  for (const box of boxes) expect(box?.height).toBeGreaterThanOrEqual(44)
  expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x + .5)
  expect(boxes[1]!.x + boxes[1]!.width).toBeLessThanOrEqual(boxes[2]!.x + .5)

  await side.click()
  await expect(side).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("img", { name: "Side view illustration of Monsoon Blue" })).toBeVisible()
  await side.press("ArrowRight")
  await expect(model).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("tabpanel")).toHaveAccessibleName("3D view")
  await expect(page.getByRole("img", { name: "Illustrative oval cut model of Monsoon Blue" })).toBeVisible()
  await face.click()
  await expect(face).toHaveAttribute("aria-selected", "true")
})

test("cart persistence, currency switch, enquiry and removal", async ({ page }) => {
  await page.goto(product)
  await page.getByRole("button", { name: "Currency LKR. Switch currency" }).click()
  await expect(page.getByRole("button", { name: "Currency USD. Switch currency" })).toBeVisible()
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await expect(page.getByRole("button", { name: "In your cart" })).toBeDisabled()
  await page.reload()
  await page.getByRole("button", { name: "Open cart, 1 stones" }).click()
  const cart = page.getByRole("dialog", { name: "Your cart" })
  await expect(cart.getByRole("link", { name: "Monsoon Blue" })).toHaveAttribute("href", product)
  await expect(cart.getByText("Sample total")).toBeVisible()
  await expect(cart.getByRole("link", { name: "Go to checkout" })).toHaveCount(0)
  await cart.getByRole("button", { name: "Request these stones" }).click()

  const enquiry = page.getByRole("dialog", { name: "Enquire about a stone" })
  await expect(enquiry.getByText("Monsoon Blue")).toBeVisible()
  await enquiry.getByLabel("Name", { exact: true }).fill("Test Visitor")
  await enquiry.getByLabel("Mobile", { exact: true }).fill("+94 77 123 4567")
  await enquiry.getByLabel("Email", { exact: true }).fill("test@example.test")
  await expect(enquiry.getByLabel("Gem of interest")).toHaveValue("Sapphire")
  await enquiry.getByLabel("Budget range").selectOption("Prefer to discuss")
  await enquiry.getByRole("button", { name: "Submit enquiry" }).click()
  await expect(page.getByText("Preview complete. Your enquiry was not sent.")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Open cart, 1 stones" }).click()
  await cart.getByRole("button", { name: "Remove Monsoon Blue" }).click()
  await expect(cart.getByText("Your cart is empty.")).toBeVisible()
})

test("contact validation and submission, admin guard and safe preview checkout", async ({ page, request }) => {
  await page.goto("/contact")
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.getByText("Enter your name.")).toBeVisible()
  await page.getByLabel("Name", { exact: true }).fill("Test Visitor")
  await page.getByLabel("Email", { exact: true }).fill("test@example.test")
  await page.getByLabel("Subject", { exact: true }).fill("A stone enquiry")
  await page.getByLabel("Message", { exact: true }).fill("Can you share more about this stone?")
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.getByText("Preview complete. Your message was not sent.")).toBeVisible()

  for (const route of ["/admin", "/admin?view=orders", "/admin?view=inbox", "/admin/products/new"]) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/admin\/login$/)
    await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible()
  }
  await page.goto("/checkout")
  await expect(page.getByText("Online payment is currently unavailable.", { exact: false })).toBeVisible()
  expect((await request.post("/api/checkout", { data: {} })).status()).toBe(503)
  expect((await request.post("/api/payhere/notify", { form: {} })).status()).toBe(503)
  for (const route of ["/api/contact", "/api/enquiry"]) {
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
    const wordmark = page.locator(".footer-wordmark")
    await expect(wordmark).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
    const fill = () => wordmark.evaluate((node) => node.style.getPropertyValue("--footer-fill"))
    await expect.poll(fill, { message: route }).toBe("0.00%")
    await scrollPastWordmarkReveal(page, -30)
    expect(await fill(), route).toBe("0.00%")
    await scrollPastWordmarkReveal(page, 6)
    expect(await fill(), route).toBe("0.00%")
    await scrollPastWordmarkReveal(page, 44)
    const duringFill = parseFloat(await fill())
    expect(duringFill, route).toBeGreaterThan(20)
    expect(duringFill, route).toBeLessThan(90)
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

  for (const url of ["/", "/about", "/shop", product, "/contact", "/checkout", "/admin/login"]) {
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
  expect(await map.text()).toContain(product + "</loc>")
  expect((await request.get("/robots.txt")).status()).toBe(200)
  expect((await request.get("/images/stones/monsoon-blue")).status()).toBe(200)
  expect((await request.get("/shop/does-not-exist")).status()).toBe(404)
})
