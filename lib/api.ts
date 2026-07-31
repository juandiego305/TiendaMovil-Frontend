// Archivo para manejar las peticiones a la API
import { getApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = getApiBaseUrl()

const API_URL = `${API_BASE_URL}/api`

// Interfaz para los productos según el backend
export interface Producto {
  id?: number
  nombre: string
  categoria: string
  precio: number
  cantidad: number
  codigo_barras?: string
}

// Función para generar un código de barras aleatorio
export function generarCodigoBarras(): string {
  return Math.floor(Math.random() * 10000000000000)
    .toString()
    .padStart(13, "0")
}

// Función para obtener todos los productos
export async function obtenerProductos(): Promise<Producto[]> {
  try {
    const response = await fetch(`${API_URL}/productos/`)

    if (!response.ok) {
      throw new Error("Error al obtener productos")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Función para obtener un producto por ID
export async function obtenerProductoPorId(id: number): Promise<Producto | null> {
  try {
    const response = await fetch(`${API_URL}/productos/${id}/`)

    if (!response.ok) {
      throw new Error("Producto no encontrado")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error al obtener producto con ID ${id}:`, error)
    return null
  }
}

// Función para crear un nuevo producto
export async function crearProducto(producto: Producto): Promise<Producto | null> {
  try {
    // Si no tiene código de barras, generamos uno
    if (!producto.codigo_barras) {
      producto.codigo_barras = generarCodigoBarras()
    }

    const response = await fetch(`${API_URL}/productos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Error al crear producto")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error al crear producto:", error)
    return null
  }
}

// Función para actualizar un producto existente
export async function actualizarProducto(id: number, producto: Producto): Promise<Producto | null> {
  try {
    const response = await fetch(`${API_URL}/productos/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Error al actualizar producto")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error al actualizar producto con ID ${id}:`, error)
    return null
  }
}

// Función para eliminar un producto
export async function eliminarProducto(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/productos/${id}/`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Error al eliminar producto")
    }

    return true
  } catch (error) {
    console.error(`Error al eliminar producto con ID ${id}:`, error)
    return false
  }
}

