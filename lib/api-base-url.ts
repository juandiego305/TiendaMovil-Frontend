const DEFAULT_PROD_API_URL = "https://proyecto-tiendamovil.onrender.com"
const DEFAULT_LOCAL_API_URL = "http://localhost:8000"

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "")
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl)
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return normalizeBaseUrl(process.env.NEXT_PUBLIC_LOCAL_API_URL || DEFAULT_LOCAL_API_URL)
    }
  }

  return DEFAULT_PROD_API_URL
}