import { fetchWithAuth } from "@/services/auth-service"
// services/auth-service.ts (o lib/api.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://proyecto-tiendamovil.onrender.com';

export async function selectStoreAndRefreshToken(storeId: string): Promise<boolean> {
  try {
    console.log(`Seleccionando tienda con ID: ${storeId}`)
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/tiendas/${storeId}/seleccionar_tienda/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error al seleccionar tienda: ${response.status} - ${response.statusText}`, errorText)
      throw new Error(`Error al seleccionar tienda: ${response.status} - ${response.statusText}`)
    }

    console.log("Tienda seleccionada correctamente")
    return true
  } catch (err) {
    console.error("Error al seleccionar tienda:", err)
    alert(
      `No se pudo seleccionar la tienda: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
    )
    return false
  }
}

