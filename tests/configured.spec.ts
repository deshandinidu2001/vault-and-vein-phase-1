import { createHash, randomUUID } from "node:crypto"
import { expect, test, type Page } from "@playwright/test"

const canonicalOrigin = "https://vault-fixture.example"
const listing = "/shop/fixture-sapphire"
const adminPassword = "fixture-password"

async function login(page: Page, role: "visitor" | "admin") {
  await page.goto("/admin/login")
  await page.getByLabel("Email", { exact: true }).fill("vault-fixture-" + role + "@example.test")
  await page.getByLabel("Password", { exact: true }).fill(adminPassword)
  await page.getByRole("button", { name: "Sign in" }).click()
}

test("configured checkout, webhook verification, durable messages and admin fulfillment", async ({ page, request }) => {
  await page.goto(listing)
  await page.getByRole("button", { name: "Add to Cart" }).click()
  await page.getByRole("button", { name: "Open cart, 1 stones" }).click()
  await page.getByRole("link", { name: "Go to checkout" }).click()
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()

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

  const base = "http://127.0.0.1:3211"
  await page.goto(base + returnPath)
  await expect(page.getByText(/waiting for confirmation/)).toBeVisible()
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
  await expect(page.getByRole("button", { name: "Open cart, 0 stones" })).toBeVisible()
  await page.goto(base + listing)
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled()

  const contact = await request.post("/api/contact", { data: {
    name: "Test Visitor", email: "contact@example.test", subject: "A configured message", message: "Can you tell me more about this stone?",
  } })
  expect(contact.status()).toBe(201)
  const enquiry = await request.post("/api/enquiry", { data: {
    name: "Test Visitor", email: "enquiry@example.test", mobile: "+94 77 123 4567", gem: "Sapphire",
    budget: "Prefer to discuss", colour: "Blue", size: "", notes: "", stones: ["fixture-sapphire"],
  } })
  expect(enquiry.status()).toBe(201)

  await login(page, "visitor")
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("These credentials did not grant admin access.")
  await login(page, "admin")
  await expect(page.getByRole("heading", { name: "Store admin" })).toBeVisible()
  await page.getByRole("link", { name: "Orders", exact: true }).click()
  await expect(page.getByText("checkout@example.test")).toBeVisible()
  await page.getByRole("button", { name: "Mark as shipped" }).click()
  await expect(page.getByRole("heading", { name: "shipped order", exact: false })).toBeVisible()
  await page.getByRole("link", { name: "Inbox", exact: true }).click()
  await expect(page.getByText("A configured message")).toBeVisible()
  await expect(page.getByText("enquiry@example.test")).toBeVisible()
  const contactCard = page.getByRole("listitem").filter({ hasText: "A configured message" })
  await contactCard.getByRole("button", { name: "Mark as read" }).click()
  await expect(contactCard.getByRole("button", { name: "Mark as read" })).toHaveCount(0)

  await page.getByRole("link", { name: "Inventory", exact: true }).click()
  await page.getByRole("link", { name: "Add listing" }).click()
  for (const [label, value] of [
    ["Name", "Test Spinel"], ["URL slug", "test-spinel"], ["Colour", "Red"], ["Clarity", "Eye clean"],
    ["Treatment", "None stated"], ["Origin", "Sri Lanka"], ["Weight (ct)", "1.25"], ["Length (mm)", "7.2"],
    ["Width (mm)", "5.3"], ["Depth (mm)", "3.4"], ["Price (LKR)", "90000"], ["Description", "An additional browser test listing."],
  ]) await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel("Gem type").selectOption("spinel")
  await page.getByRole("button", { name: "Save listing" }).click()
  await expect(page.getByText("Listing saved.")).toBeVisible()
  const newListing = page.getByRole("listitem").filter({ hasText: "Test Spinel" })
  await expect(newListing.getByText(/Draft/)).toBeVisible()
  const unpublished = await request.get("/shop/test-spinel")
  expect(unpublished.status()).toBe(404)
  await newListing.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(newListing.getByRole("link", { name: "View listing" })).toBeVisible()
  expect((await request.get("/shop/test-spinel")).status()).toBe(200)
  await newListing.getByRole("link", { name: "Edit listing" }).click()
  await page.getByLabel("Price (LKR)", { exact: true }).fill("95000")
  await page.getByRole("button", { name: "Save listing" }).click()
  await expect(newListing.getByText(/95,000/)).toBeVisible()
  await newListing.getByRole("button", { name: "Unpublish" }).click()
  await expect(newListing.getByText(/Draft/)).toBeVisible()
  expect((await request.get("/shop/test-spinel")).status()).toBe(404)
  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/admin\/login$/)
  await page.goto("/admin?view=orders")
  await expect(page).toHaveURL(/\/admin\/login$/)
})
