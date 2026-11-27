import { createHash, randomUUID } from "node:crypto"
import { expect, test, type Page } from "@playwright/test"
import { fixturePassword, updatedFixturePassword } from "./support/neon-auth-fixture.mjs"

const canonicalOrigin = "https://vault-fixture.example"
const listing = "/shop/fixture-sapphire"
const samplePhoto = {
  name: "test-stone.png", mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yA5sAAAAASUVORK5CYII=", "base64"),
}

async function signInWithPassword(page: Page, email = "vault8vein@gmail.com", password = fixturePassword) {
  await page.goto("/vault8@vein@8/login")
  await page.getByLabel("Email", { exact: true }).fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
}

async function submitCode(page: Page, code: string, pin: string) {
  await page.getByLabel("Verification code").fill(code)
  await page.getByLabel("New PIN", { exact: true }).fill(pin)
  await page.getByLabel("Confirm new PIN", { exact: true }).fill(pin)
  await page.getByRole("button", { name: "Save PIN and sign in" }).click()
}

test("configured checkout, webhook verification, durable messages and admin fulfillment", async ({ page, request, baseURL }) => {
  await page.route("https://res.cloudinary.com/vault-fixture/**", (route) => route.fulfill({ contentType: "image/png", body: samplePhoto.buffer }))
  await page.goto("/shop/fixture-sample")
  await expect(page.getByText("Sample listing for display only.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Add to Cart" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Buy now" })).toHaveCount(0)
  expect((await request.get("/images/stones/fixture-sample")).status()).toBe(404)
  expect((await request.get("/admin")).status()).toBe(404)
  await page.goto("/shop/fixture-garnet")
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.goto(listing)
  await expect(page.locator(".product-feature-image").getByText("Photo unavailable")).toBeVisible()
  await expect(page.getByRole("region", { name: "Description" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Specifications" }).getByText("Dimensions")).toBeVisible()
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.getByRole("button", { name: "Open cart, 2 stones" }).click()
  await expect(page.getByRole("link", { name: "Go to checkout" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Pay for this stone: Fixture Sapphire" })).toBeVisible()
  await page.goto(listing)
  const checkoutDocument = page.waitForResponse(response => response.request().isNavigationRequest() && new URL(response.url()).pathname === "/checkout")
  await page.getByRole("button", { name: "Buy now" }).click()
  expect((await checkoutDocument).headers()["content-security-policy"]).toContain("'nonce-")
  await expect(page).toHaveURL(/\/checkout\?item=/)
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
  await expect(page.getByText("Fixture Sample", { exact: true })).toHaveCount(0)

  const invalidOrigin = await request.post("/api/checkout", { data: {} })
  expect(invalidOrigin.status()).toBe(403)
  const invalidCart = await request.post("/api/checkout", { headers: { origin: canonicalOrigin }, data: {} })
  expect(invalidCart.status()).toBe(400)
  await page.route("**/api/checkout", async (route) => {
    const response = await route.fetch({ headers: { ...route.request().headers(), origin: canonicalOrigin } })
    await route.fulfill({ response })
  })
  for (const [label, value] of [
    ["First name", "Test"], ["Last name", "Buyer"], ["Email", "checkout@example.test"],
    ["Phone", "+94 77 123 4567"], ["Street address", "15 Example Road"], ["City", "Colombo"],
  ]) await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByRole("button", { name: "Reserve for payment" }).click()
  await expect(page.getByRole("heading", { name: "Your stones are reserved" })).toBeVisible()
  await expect(page.getByText("LKR 125,500", { exact: true })).toBeVisible()

  const returnLink = await page.getByRole("link", { name: "View order status" }).getAttribute("href")
  expect(returnLink).toMatch(/^\/order\/[\w-]+\?key=[\w-]+$/)
  const returnPath = returnLink!
  await page.route("https://sandbox.payhere.lk/pay/checkout", (route) => route.fulfill({
    contentType: "text/html", body: "<h1>PayHere sandbox intercepted by the local fixture</h1>",
  }))
  const posted = page.waitForRequest((network) => network.url() === "https://sandbox.payhere.lk/pay/checkout")
  await page.getByRole("button", { name: "Continue to PayHere sandbox" }).click()
  const fields = new URLSearchParams((await posted).postData() ?? "")
  const orderId = fields.get("order_id")!
  const amount = fields.get("amount")!
  expect(amount).toBe("125500.00")
  expect(fields.get("return_url")).toBe(canonicalOrigin + returnPath)
  expect(fields.get("notify_url")).toBe(canonicalOrigin + "/api/payhere/notify")
  const md5 = (value: string) => createHash("md5").update(value).digest("hex").toUpperCase()
  const secret = md5("fixture-merchant-secret")
  expect(fields.get("hash")).toBe(md5("000000" + orderId + amount + "LKR" + secret))

  const base = baseURL!
  await page.goto(base + returnPath)
  await expect(page.getByText(/waiting for confirmation/)).toBeVisible()
  const receiptHeaders = (await request.get(returnPath)).headers()
  expect(receiptHeaders["referrer-policy"]).toBe("no-referrer")
  expect(receiptHeaders["content-security-policy"]).toContain("'nonce-")
  expect(receiptHeaders["cache-control"]).toContain("no-store")
  expect((await request.get("/order/" + orderId + "?key=" + randomUUID())).status()).toBe(404)
  const notify = {
    merchant_id: "000000", order_id: orderId, payment_id: "fixture-payment-1", payhere_amount: amount,
    payhere_currency: "LKR", status_code: "2", md5sig: md5("000000" + orderId + amount + "LKR2" + secret),
  }
  expect((await request.post("/api/payhere/notify", { form: { ...notify, payhere_amount: "1.00" } })).status()).toBe(400)
  expect((await request.post("/api/payhere/notify", { form: notify })).status()).toBe(200)
  expect((await request.post("/api/payhere/notify", { form: notify })).status()).toBe(200)
  await page.getByRole("button", { name: "Refresh status" }).click()
  await expect(page.getByText("Your payment is confirmed.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Open cart, 1 stones" })).toBeVisible()
  await page.goto(base + listing)
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled()
  const sold = await request.post("/api/checkout", {
    headers: { origin: canonicalOrigin },
    data: {
      ids: ["fd9f8831-e604-48cc-9d2c-79860244d258"], requestId: randomUUID(),
      first_name: "Second", last_name: "Buyer", email: "second@example.test",
      phone: "+94 77 123 4567", address: "15 Example Road", city: "Colombo",
    },
  })
  expect(sold.status()).toBe(409)

  const contact = await request.post("/api/contact", { data: {
    name: "Test Visitor", email: "contact@example.test", subject: "A configured message", message: "Can you tell me more about this stone?",
  } })
  expect(contact.status()).toBe(201)
  const enquiry = await request.post("/api/enquiry", { data: {
    name: "Test Visitor", email: "enquiry@example.test", mobile: "+94 77 123 4567", gem: "Sapphire",
    budget: "Prefer to discuss", colour: "Blue", size: "", notes: "", stones: ["fixture-sapphire"],
  } })
  expect(enquiry.status()).toBe(201)

  await signInWithPassword(page, "visitor@example.test")
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("The email or password is incorrect, or the account has not been verified.")
  expect((await page.context().cookies()).some(cookie => cookie.name === "__Host-vault-admin-pin")).toBe(false)
  await page.goto("/vault8@vein@8/products/new")
  await expect(page).toHaveURL(/\/vault8@vein@8\/login/)
  await expect(page.getByLabel("Choose photos")).toHaveCount(0)
  await page.goto("/vault8@vein@8?view=filters")
  await expect(page).toHaveURL(/\/vault8@vein@8\/login/)
  await page.goto("/vault8@vein@8/verify")
  await expect(page).toHaveURL(/\/vault8@vein@8\/login/)
  await signInWithPassword(page)
  await expect(page).toHaveURL(/\/vault8@vein@8\/verify$/)
  await page.goto("/vault8@vein@8/products/new")
  await expect(page).toHaveURL(/\/vault8@vein@8\/verify$/, { timeout: 15000 })
  await page.getByRole("button", { name: "Send verification code" }).click()
  await expect(page.getByRole("status")).toContainText("Check your email")
  await submitCode(page, "000000", "86425139")
  await expect(page.getByRole("main").getByRole("alert")).toContainText("invalid or expired")
  await submitCode(page, "123456", "86425139")
  await expect(page).toHaveURL(/\/vault8@vein@8$/)
  await page.goto("/vault8@vein@8/verify")
  await expect(page).toHaveURL(/\/vault8@vein@8$/)
  await expect(page.getByRole("heading", { name: "Store admin" })).toBeVisible()
  await expect(page.locator(".site-footer")).toHaveCount(0)
  expect((await page.context().cookies()).some((cookie) => cookie.name === "__Host-vault-admin-pin" && cookie.httpOnly && cookie.sameSite === "Strict" && cookie.secure)).toBe(true)
  const authenticated = await page.request.get("/vault8@vein@8")
  expect(authenticated.headers()["cache-control"]).toContain("no-store")
  expect(authenticated.headers()["content-security-policy"]).toContain("frame-ancestors 'none'")
  expect(authenticated.headers()["content-security-policy"]).toContain("'nonce-")
  const secondPolicy = (await page.request.get("/vault8@vein@8")).headers()["content-security-policy"]
  expect(secondPolicy).not.toBe(authenticated.headers()["content-security-policy"])
  const crossOriginLock = await page.request.post("/vault8@vein@8/lock", {
    headers: { Origin: "https://unrelated.example" },
  })
  expect(crossOriginLock.status()).toBe(403)
  const priorUnlock = (await page.context().cookies()).find(cookie => cookie.name === "__Host-vault-admin-pin")!
  await page.getByRole("button", { name: "View storefront" }).click()
  await expect(page).toHaveURL(url => url.pathname === "/")
  expect((await page.context().cookies()).some(cookie => cookie.name === "__Host-vault-admin-pin")).toBe(false)
  await page.context().addCookies([priorUnlock])
  const lockedTab = await page.context().newPage()
  await lockedTab.goto("/vault8@vein@8")
  await expect(lockedTab).toHaveURL(/\/vault8@vein@8\/login$/)
  await lockedTab.close()
  await page.context().clearCookies({ name: priorUnlock.name })
  await page.goBack()
  await expect(page.getByRole("heading", { name: "Enter admin PIN" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Store admin" })).toHaveCount(0)
  await page.getByLabel("Admin PIN").fill("86425139")
  await page.getByRole("button", { name: "Sign in to admin" }).click()
  await expect(page.getByRole("heading", { name: "Store admin" })).toBeVisible()
  await page.getByRole("link", { name: "Orders", exact: true }).click()
  await expect(page.getByRole("region", { name: "Online checkout" })).toContainText("PayHere is configured in sandbox mode.")
  await expect(page.getByText("checkout@example.test")).toBeVisible()
  await page.getByRole("button", { name: "Mark as shipped" }).click()
  await expect(page.getByRole("heading", { name: "shipped order", exact: false })).toBeVisible()
  await page.getByRole("link", { name: "Inbox", exact: true }).click()
  await expect(page.getByText("A configured message")).toBeVisible()
  await expect(page.getByText("enquiry@example.test")).toBeVisible()
  const contactCard = page.getByRole("listitem").filter({ hasText: "A configured message" })
  await contactCard.getByRole("button", { name: "Mark as read" }).click()
  await expect(contactCard.getByRole("button", { name: "Mark as read" })).toHaveCount(0)

  await page.getByRole("link", { name: "Shop filters", exact: true }).click()
  await expect(page.getByRole("navigation", { name: "Store admin" }).getByRole("link", { name: "Categories", exact: true })).toHaveCount(0)
  const gemTypeOptions = page.getByRole("region", { name: "Gem type", exact: true })
  await gemTypeOptions.getByText("Manage options", { exact: false }).click()
  await gemTypeOptions.getByRole("textbox", { name: "New gem type" }).fill("Tourmaline")
  await gemTypeOptions.getByRole("button", { name: "Add gem type", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("Gem type added.")
  await page.goto("/shop")
  await page.getByRole("button", { name: "Filters", exact: true }).click()
  await expect(page.getByLabel("Gem type", { exact: true }).locator('option[value="tourmaline"]')).toHaveText("Tourmaline")
  await page.goto("/vault8@vein@8?view=filters")
  await page.getByRole("button", { name: "Hide Price range (LKR) filter", exact: true }).click()
  await expect(page.getByRole("button", { name: "Show Price range (LKR) filter", exact: true })).toBeVisible()
  for (const [group, label] of [["Cut", "Marquise"], ["Collection", "Estate stones"], ["Colour", "Rose"], ["Origin", "Madagascar"]]) {
    const panel = page.getByRole("region", { name: group, exact: true })
    await panel.getByText("Manage options", { exact: false }).click()
    await panel.getByRole("textbox", { name: "New " + group.toLowerCase() + " option" }).fill(label)
    await panel.getByRole("button", { name: "Add option", exact: true }).click()
    await expect(page.getByRole("status")).toHaveText("Shop filter option added.")
    await expect(panel.locator("li").filter({ hasText: label })).toHaveCount(1)
  }

  await page.getByRole("link", { name: "Inventory", exact: true }).click()
  await page.getByRole("link", { name: "Add listing" }).click()
  for (const [label, value] of [
    ["Name", "Test Spinel"], ["URL slug", "test-spinel"], ["Colour", "Rose"], ["Clarity", "Eye clean"],
    ["Treatment", "None stated"], ["Origin", "Madagascar"], ["Weight (ct)", "1.25"], ["Length (mm)", "7.2"],
    ["Width (mm)", "5.3"], ["Depth (mm)", "3.4"], ["Price (LKR)", "90000"], ["Description", "An additional browser test listing."],
  ]) await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel("Gem type").selectOption("spinel")
  await expect(page.getByRole("combobox", { name: "Gem type", exact: true }).locator('option[value="tourmaline"]')).toHaveText("Tourmaline")
  await page.getByRole("combobox", { name: "Cut", exact: true }).selectOption("Marquise")
  await page.getByRole("checkbox", { name: "Estate stones" }).check()
  await page.getByLabel("Choose photos").setInputFiles([samplePhoto, { ...samplePhoto, name: "other-angle.png" }])
  const previews = page.getByRole("list", { name: "Selected photo previews" })
  await expect(previews.getByRole("img")).toHaveCount(2)
  await expect.poll(() => previews.getByRole("img", { name: "Preview of other-angle.png" })
    .evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await page.getByRole("button", { name: "Save listing" }).click()
  await expect(page.getByText("Listing saved.")).toBeVisible()
  const newListing = page.getByRole("listitem").filter({ hasText: "Test Spinel" })
  await expect(newListing.locator("img")).toHaveAttribute("src", /res\.cloudinary\.com\/vault-fixture\/image\/upload\//)
  await expect(newListing.locator("img")).toHaveAttribute("sizes", "70px")
  await expect(newListing.locator("img")).toHaveAttribute("srcset", /w_96,.* 96w/)
  await expect(newListing.getByText(/Draft/)).toBeVisible()
  const unpublished = await request.get("/shop/test-spinel")
  expect(unpublished.status()).toBe(404)
  await newListing.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(newListing.getByRole("button", { name: "View listing" })).toBeVisible()
  expect((await request.get("/shop/test-spinel")).status()).toBe(200)
  await newListing.getByRole("link", { name: "Edit listing" }).click()
  const galleryEditor = page.getByRole("region", { name: "Product photos" })
  const firstCover = await galleryEditor.getByRole("img", { name: "Cover photo", exact: true }).getAttribute("src")
  const additionalPhoto = await galleryEditor.getByRole("img", { name: "Product photo 2", exact: true }).getAttribute("src")
  await galleryEditor.getByLabel("Choose photos").setInputFiles(samplePhoto)
  await expect(galleryEditor.getByRole("img", { name: "Preview of test-stone.png" })).toBeVisible()
  await galleryEditor.getByRole("button", { name: "Upload photos", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("Product photos updated.")
  const thirdPhoto = await galleryEditor.getByRole("img", { name: "Product photo 3", exact: true }).getAttribute("src")
  expect(additionalPhoto).not.toBe(firstCover)
  await galleryEditor.getByRole("button", { name: "Set photo 2 as cover" }).click()
  await expect(galleryEditor.getByRole("img", { name: "Cover photo", exact: true })).toHaveAttribute("src", additionalPhoto!)

  await page.goto("/shop/test-spinel")
  const coverFilename = additionalPhoto!.split("/").at(-1)!
  const cover = page.getByRole("img", { name: "Photo of Test Spinel", exact: true })
  await expect(cover).toHaveAttribute("src", new RegExp(coverFilename + "$"))
  await expect(cover).toHaveCSS("object-fit", "cover")
  await expect(cover).toHaveCSS("padding", "0px")
  await page.getByRole("button", { name: "Show photo 2" }).press("Enter")
  await expect(page.getByRole("img", { name: "Photo 2 of Test Spinel", exact: true })).toHaveAttribute("src", new RegExp(firstCover!.split("/").at(-1)! + "$"))
  await page.goto("/shop")
  await page.getByRole("button", { name: "Filters", exact: true }).click()
  await expect(page.getByRole("group", { name: "Price range (LKR)" })).toHaveCount(0)
  await page.getByLabel("Cut", { exact: true }).selectOption({ label: "Marquise" })
  await page.getByLabel("Collection", { exact: true }).selectOption({ label: "Estate stones" })
  await page.getByLabel("Colour", { exact: true }).selectOption({ label: "Rose" })
  await page.getByLabel("Origin", { exact: true }).selectOption({ label: "Madagascar" })
  await page.getByRole("button", { name: "Apply filters", exact: true }).click()
  await expect(page.getByText("1 stone found", { exact: true })).toBeVisible()
  await expect(page.locator("#results").getByText("Test Spinel", { exact: true })).toBeVisible()
  const shopPhoto = page.locator("#results").getByRole("img", { name: "Photo of Test Spinel", exact: true })
  await expect(shopPhoto).toHaveAttribute("src", new RegExp(coverFilename + "$"))
  await expect(shopPhoto).toHaveCSS("padding", "0px")

  await page.goto("/vault8@vein@8?view=filters")
  await gemTypeOptions.getByText("Manage options", { exact: false }).click()
  await gemTypeOptions.getByRole("button", { name: "Hide Gem type option Spinel" }).click()
  await expect(page.getByRole("status")).toHaveText("Gem type visibility updated.")
  await page.goto("/shop")
  await page.getByRole("button", { name: "Filters", exact: true }).click()
  await expect(page.getByLabel("Gem type", { exact: true }).locator('option[value="spinel"]')).toHaveCount(0)
  await expect(page.locator("#results").getByText("Test Spinel", { exact: true })).toHaveCount(0)
  expect((await request.get("/shop/test-spinel")).status()).toBe(404)
  await page.goto("/vault8@vein@8")
  await expect(newListing.getByRole("link", { name: "Manage gem type" })).toBeVisible()
  await newListing.getByRole("link", { name: "Manage gem type" }).click()
  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.status()).toBe(200)
  expect(await sitemap.text()).not.toContain("/shop/test-spinel")
  await gemTypeOptions.getByText("Manage options", { exact: false }).click()
  await gemTypeOptions.getByRole("button", { name: "Show Gem type option Spinel" }).click()
  await expect(page.getByRole("status")).toHaveText("Gem type visibility updated.")
  expect((await request.get("/shop/test-spinel")).status()).toBe(200)
  await page.goto("/vault8@vein@8?status=available")
  await newListing.getByRole("link", { name: "Edit listing" }).click()
  await galleryEditor.getByRole("button", { name: "Remove cover photo", exact: true }).click()
  await expect(galleryEditor.getByRole("img", { name: "Cover photo", exact: true })).toHaveAttribute("src", firstCover!)
  await galleryEditor.getByRole("button", { name: "Remove cover photo", exact: true }).click()
  await expect(galleryEditor.getByRole("img", { name: "Cover photo", exact: true })).toHaveAttribute("src", thirdPhoto!)
  await galleryEditor.getByRole("button", { name: "Remove cover photo", exact: true }).click()
  await expect(galleryEditor.getByRole("img", { name: "Cover photo", exact: true })).toHaveCount(0)
  await page.getByLabel("Price (LKR)", { exact: true }).fill("95000")
  await page.getByLabel("Availability").selectOption("unavailable")
  await page.getByRole("button", { name: "Save listing" }).click()
  await expect(newListing.getByText(/95,000/)).toBeVisible()
  await expect(newListing.getByText("unavailable", { exact: true })).toBeVisible()
  const unavailableProduct = await page.context().newPage()
  await unavailableProduct.goto("/shop/test-spinel")
  await expect(unavailableProduct.getByRole("button", { name: "Unavailable", exact: true })).toBeDisabled()
  await expect(unavailableProduct.getByRole("button", { name: "Buy now" })).toHaveCount(0)
  await unavailableProduct.close()
  await expect(newListing.locator("img")).toHaveCount(0)
  await newListing.getByRole("button", { name: "Unpublish" }).click()
  await expect(newListing.getByText(/Draft/)).toBeVisible()
  expect((await request.get("/shop/test-spinel")).status()).toBe(404)
  await newListing.getByText("Delete listing", { exact: true }).click()
  await newListing.getByRole("button", { name: "Confirm delete" }).click()
  await expect(page.getByText("Listing removed from the shop and inventory.")).toBeVisible()
  await expect(newListing).toHaveCount(0)
  const priorCookies = (await page.context().cookies()).filter(cookie =>
    ["__Secure-neon-auth.session_token", "__Host-vault-admin-pin", "__Host-vault-admin-password"].includes(cookie.name))
  expect(priorCookies).toHaveLength(3)
  await page.getByRole("link", { name: "vault8vein@gmail.com" }).click()
  await expect(page.getByRole("heading", { name: "Account security" })).toBeVisible()
  await page.getByRole("link", { name: "Change PIN" }).click()
  await page.getByRole("button", { name: "Send verification code" }).click()
  await expect(page.getByRole("status")).toContainText("Check your email")
  await submitCode(page, "123456", "95738401")
  await expect(page).toHaveURL(/\/vault8@vein@8$/)
  const staleBrowser = await page.context().browser()!.newContext({ baseURL })
  try {
    await staleBrowser.addCookies(priorCookies)
    const stalePage = await staleBrowser.newPage()
    await stalePage.goto("/vault8@vein@8")
    await expect(stalePage).toHaveURL(/\/vault8@vein@8\/login$/)
    await expect(stalePage.getByRole("heading", { name: "Store admin" })).toHaveCount(0)
  } finally {
    await staleBrowser.close()
  }
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.goto("/vault8@vein@8?view=orders")
  await expect(page).toHaveURL(/\/vault8@vein@8\/login$/)
  await signInWithPassword(page)
  await expect(page.getByRole("heading", { name: "Enter admin PIN" })).toBeVisible()
  await page.getByLabel("Admin PIN").fill("86425139")
  await page.getByRole("button", { name: "Sign in to admin" }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText("PIN is incorrect")
  await page.getByLabel("Admin PIN").fill("95738401")
  await page.getByRole("button", { name: "Sign in to admin" }).click()
  await expect(page.getByRole("heading", { name: "Store admin" })).toBeVisible()
  await page.goto("/vault8@vein@8/login")
  await expect(page).toHaveURL(/\/vault8@vein@8$/)

  await page.goto("/vault8@vein@8/account")
  await page.getByLabel("Current password").fill(fixturePassword)
  await page.getByLabel("New password", { exact: true }).fill(updatedFixturePassword)
  await page.getByLabel("Confirm new password").fill(updatedFixturePassword)
  await page.getByRole("button", { name: "Save new password" }).click()
  await expect(page.getByRole("status")).toContainText("Password updated")
  await signInWithPassword(page)
  await expect(page.getByRole("main").getByRole("alert")).toContainText("incorrect")
  await signInWithPassword(page, "vault8vein@gmail.com", updatedFixturePassword)
  await expect(page.getByRole("heading", { name: "Enter admin PIN" })).toBeVisible()
  await page.getByRole("button", { name: "Sign out" }).click()

  await page.getByRole("link", { name: "Set or reset password" }).click()
  await page.getByRole("button", { name: "Send password reset code" }).click()
  await expect(page.getByRole("status")).toContainText("check your email")
  await page.getByLabel("Verification code").fill("123456")
  await page.getByLabel("New password", { exact: true }).fill(fixturePassword)
  await page.getByLabel("Confirm new password").fill(fixturePassword)
  await page.getByRole("button", { name: "Save password" }).click()
  await expect(page.getByRole("status")).toContainText("Password updated")
  await signInWithPassword(page)
  await expect(page.getByRole("heading", { name: "Enter admin PIN" })).toBeVisible()
})

test("a slow product navigation shows loading feedback", async ({ page }) => {
  await page.goto("/shop")
  const card = page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Fixture Sapphire" }) })
  await expect(card).toBeVisible()
  let release: () => void = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route(url => url.pathname === listing, async route => {
    await held
    await route.continue()
  })
  const click = card.click()
  try {
    await expect(card.getByRole("status")).toHaveText("Loading page…")
  } finally {
    release()
  }
  await click
  await expect(page.getByRole("heading", { name: "Fixture Sapphire", level: 1 })).toBeVisible()
})
