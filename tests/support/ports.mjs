// Override the first port when the default range is reserved by the host OS.
const first = Number(process.env.PLAYWRIGHT_START_PORT ?? 3210)
if (!Number.isInteger(first) || first < 1024 || first > 65533) {
  throw new Error("PLAYWRIGHT_START_PORT must be an integer from 1024 to 65533")
}
export const storefrontPort = first
export const configuredPort = first + 1
export const databasePort = first + 2
export const localUrl = port => "http://127.0.0.1:" + port
