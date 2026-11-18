export async function sendMessage(kind: "contact" | "enquiry", values: unknown) {
  const response = await fetch("/api/" + kind, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
  })
  const result = await response.json() as { preview?: boolean; message?: string }
  if (!response.ok) throw new Error(result.message || "Please try again.")
  return result.preview === true
}
