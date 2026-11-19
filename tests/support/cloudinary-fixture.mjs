const fetchActual = globalThis.fetch
const prefix = "https://api.cloudinary.com/v1_1/vault-fixture/image/"
const authorization = "Basic " + Buffer.from("fixture-cloud-key:fixture-cloud-secret").toString("base64")

globalThis.fetch = async (input, options) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
  if (!url.startsWith(prefix)) return fetchActual(input, options)

  const body = options?.body
  if (options?.headers?.Authorization !== authorization || options.method !== "POST" || !(body instanceof FormData)) {
    return Response.json({}, { status: 401 })
  }
  const id = body.get("public_id")
  if (typeof id !== "string" || !/^vault-and-vein\/products\/[\da-f-]{36}$/.test(id)) {
    return Response.json({}, { status: 400 })
  }
  if (url === prefix + "destroy") return Response.json({ result: "ok" })

  const file = body.get("file")
  if (url !== prefix + "upload" || !(file instanceof File) || file.type !== "image/png" || body.get("overwrite") !== "false") {
    return Response.json({}, { status: 400 })
  }
  return Response.json({
    public_id: id,
    secure_url: "https://res.cloudinary.com/vault-fixture/image/upload/v1/" + id + ".png",
  })
}
