import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = getApiBaseUrl()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para realizar solicitudes autenticadas
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Obtener token de autenticación
    const token = localStorage.getItem("backendToken")

    if (!token) {
      throw new Error("No hay token de autenticación disponible")
    }

    // Configurar opciones con el token
    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }

    console.log(`Realizando solicitud a ${url}`)
    let response = await fetch(url, authOptions)

    // Si recibimos un 401 o 403, el token puede haber expirado
    if (response.status === 401 || response.status === 403) {
      console.log(`Recibido ${response.status}, posible token expirado`)

      // Intentar renovar el token (simplificado)
      const newToken = await refreshToken()

      if (newToken) {
        // Reintentar con el nuevo token
        authOptions.headers = {
          ...authOptions.headers,
          Authorization: `Bearer ${newToken}`,
        }

        console.log(`Reintentando solicitud con nuevo token`)
        response = await fetch(url, authOptions)
      } else {
        throw new Error("No se pudo renovar la sesión")
      }
    }

    return response
  } catch (error) {
    console.error(`Error en fetchWithAuth para URL ${url}:`, error)
    throw error
  }
}

// Función para refrescar el token
async function refreshToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) {
      console.error("No hay refresh token disponible")
      return null
    }

    console.log("Refrescando token...")
    const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error(`Error al refrescar token: ${response.status}`)
      // Si hay un error al refrescar, limpiar tokens
      localStorage.removeItem("backendToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("tokenExpiresAt")
      return null
    }

    const data = await response.json()
    if (data.access) {
      localStorage.setItem("backendToken", data.access)
      // Actualizar fecha de expiración
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)
      localStorage.setItem("tokenExpiresAt", expiresAt.toISOString())
      console.log("Token refrescado exitosamente")
      return data.access
    }

    return null
  } catch (error) {
    console.error("Error al refrescar token:", error)
    return null
  }
}

