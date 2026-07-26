const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

// Actualizar la interfaz para que coincida con los campos del serializador
export interface Producto {
  id?: number
  nombre: string
  categoria: string
  precio: number
  cantidad: number
  codigo_barras?: string | null
  // Campos adicionales que usamos en el frontend pero no están en el serializador
  descripcion?: string
  disponible?: boolean
  tienda_id: number | string
  imagen?: string
  oculto?: boolean
}

function getAuthToken(): string {
  const token = localStorage.getItem("backendToken")

  if (!token) {
    throw new Error("No hay token de autenticación disponible")
  }

  return token
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  })

  return response
}

// Crear un nuevo producto - Corregido para usar fetchWithAuth
export async function createProducto(producto: Producto): Promise<Producto> {
  try {
    const tiendaId = Number(producto.tienda_id)

    if (Number.isNaN(tiendaId)) {
      throw new Error("tienda_id debe ser un número válido")
    }

    const productoData = {
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      cantidad: producto.cantidad,
      codigo_barras: producto.codigo_barras ?? null,
      tienda_id: tiendaId,
    }

    console.log("Creando producto:", productoData)

    const response = await apiFetch(`/api/productos/`, {
      method: "POST",
      body: JSON.stringify(productoData),
    })

    console.log("Respuesta del servidor:", {
      endpoint: `${API_BASE_URL}/api/productos/`,
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al crear producto:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        console.error("Detalles del error:", errorJson)
      } catch (e) {
        console.error("Respuesta de error (texto plano):", errorText)
      }

      throw new Error(`Error al crear producto: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Producto creado:", data)
    return data
  } catch (error) {
    console.error("Error en createProducto:", error)
    throw error
  }
}

// Obtener todos los productos de una tienda
export async function getProductos(tiendaId: number): Promise<Producto[]> {
  try {
    console.log(`Obteniendo productos para tienda_id=${tiendaId}`)
    const response = await apiFetch(`/api/productos/?tienda_id=${tiendaId}`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener productos:`, errorText)
      throw new Error(`Error al obtener productos: ${response.status}`)
    }

    const data = await response.json()
    console.log("Productos obtenidos:", data)
    return data
  } catch (error) {
    console.error("Error en getProductos:", error)
    throw error
  }
}

// Obtener todos los productos de una tienda
export async function getProductsByStore(tiendaId: string): Promise<Producto[]> {
  try {
    console.log(`Obteniendo productos para tienda_id=${tiendaId}`)
    const response = await apiFetch(`/api/productos/?tienda_id=${tiendaId}`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener productos:`, errorText)
      throw new Error(`Error al obtener productos: ${response.status}`)
    }

    const data = await response.json()
    console.log("Productos obtenidos:", data)
    return data
  } catch (error) {
    console.error("Error en getProductos:", error)
    throw error
  }
}

// Obtener un producto específico - Mejorado con más logs
export async function getProducto(productoId: number, tiendaId: number): Promise<Producto> {
  try {
    console.log(`Obteniendo producto con id=${productoId} para tienda_id=${tiendaId}`)

    // Verificar si tenemos el producto en localStorage para fallback
    const localStorageKey = `producto_${tiendaId}_${productoId}`
    const cachedProducto = localStorage.getItem(localStorageKey)

    const response = await apiFetch(`/api/productos/${productoId}/?tienda_id=${tiendaId}`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener producto:`, errorText)

      // Si hay un error pero tenemos datos en caché, usarlos como fallback
      if (cachedProducto) {
        console.log("Usando datos en caché para el producto:", cachedProducto)
        return JSON.parse(cachedProducto)
      }

      throw new Error(`Error al obtener producto: ${response.status}`)
    }

    const data = await response.json()
    console.log("Producto obtenido:", data)

    // Guardar en localStorage para uso futuro
    localStorage.setItem(localStorageKey, JSON.stringify(data))

    return data
  } catch (error) {
    console.error("Error en getProducto:", error)
    throw error
  }
}

// Actualizar un producto existente - Mejorado con más logs
export async function updateProducto(productoId: number, producto: Producto): Promise<Producto> {
  try {
    // Asegurarse de que tienda_id sea un número
    const tiendaId = Number(producto.tienda_id)

    // Crear un objeto que solo contenga los campos que espera el serializador
    const productoData = {
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio || 0,
      cantidad: producto.cantidad || 0,
      codigo_barras: producto.codigo_barras || null,
      tienda_id: tiendaId,
      // No incluimos oculto aquí porque el backend podría no tener este campo
    }

    console.log(`Actualizando producto con id=${productoId} para tienda_id=${tiendaId}`, productoData)

    // Guardar una copia en localStorage antes de enviar la actualización
    const localStorageKey = `producto_${tiendaId}_${productoId}`
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({
        ...productoData,
        id: productoId,
        oculto: producto.oculto || false, // Asegurarse de preservar el estado oculto
      }),
    )

    const response = await apiFetch(`/api/productos/${productoId}/?tienda_id=${tiendaId}`, {
      method: "PUT",
      body: JSON.stringify(productoData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al actualizar producto:`, errorText)
      throw new Error(`Error al actualizar producto: ${response.status}`)
    }

    const data = await response.json()
    console.log("Producto actualizado:", data)

    // Asegurarse de que el campo oculto se preserve en los datos devueltos
    return { ...data, oculto: producto.oculto || false }
  } catch (error) {
    console.error("Error en updateProducto:", error)
    throw error
  }
}

// Eliminar un producto - Mejorado con más logs
export async function deleteProducto(productoId: number, tiendaId: number): Promise<void> {
  try {
    console.log(`Eliminando producto con id=${productoId} para tienda_id=${tiendaId}`)

    const response = await apiFetch(`/api/productos/${productoId}/?tienda_id=${tiendaId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al eliminar producto:`, errorText)

      // Si el error es 400, podría ser porque el producto tiene ventas asociadas
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error && errorData.error.includes("ventas asociadas")) {
            throw new Error("No se puede eliminar un producto con ventas asociadas.")
          }
        } catch (e) {
          // Si no se puede parsear como JSON, usar el mensaje genérico
        }
      }

      throw new Error(`Error al eliminar producto: ${response.status}`)
    }

    console.log("Producto eliminado con éxito")

    // Eliminar del localStorage si existe
    const localStorageKey = `producto_${tiendaId}_${productoId}`
    localStorage.removeItem(localStorageKey)
  } catch (error) {
    console.error("Error en deleteProducto:", error)
    throw error
  }
}

// Actualizar la cantidad de un producto
export async function actualizarCantidadProducto(
  productoId: number,
  tiendaId: number,
  nuevaCantidad: number,
): Promise<void> {
  try {
    console.log(`Actualizando cantidad del producto con id=${productoId} para tienda_id=${tiendaId} a ${nuevaCantidad}`)

    const response = await apiFetch(`/api/productos/${productoId}/actualizar-cantidad/`, {
      method: "PATCH",
      body: JSON.stringify({
        tienda_id: tiendaId,
        cantidad: nuevaCantidad,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al actualizar cantidad:`, errorText)
      throw new Error(`Error al actualizar cantidad: ${response.status}`)
    }

    console.log("Cantidad actualizada con éxito")

    // Actualizar en localStorage si existe
    const localStorageKey = `producto_${tiendaId}_${productoId}`
    const cachedProducto = localStorage.getItem(localStorageKey)
    if (cachedProducto) {
      const producto = JSON.parse(cachedProducto)
      producto.cantidad = nuevaCantidad
      localStorage.setItem(localStorageKey, JSON.stringify(producto))
    }
  } catch (error) {
    console.error("Error en actualizarCantidadProducto:", error)
    throw error
  }
}

// Obtener productos disponibles (con cantidad > 0)
export async function getProductosDisponibles(tiendaId: number): Promise<Producto[]> {
  try {
    console.log(`Obteniendo productos disponibles para tienda_id=${tiendaId}`)

    const response = await apiFetch(`/api/productos/disponibles/?tienda_id=${tiendaId}`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener productos disponibles:`, errorText)
      throw new Error(`Error al obtener productos disponibles: ${response.status}`)
    }

    const data = await response.json()
    console.log("Productos disponibles:", data)
    return data
  } catch (error) {
    console.error("Error en getProductosDisponibles:", error)
    throw error
  }
}

// Obtener todas las tiendas del usuario actual
export async function getTiendasUsuario(): Promise<any[]> {
  try {
    console.log(`Obteniendo tiendas del usuario actual`)
    
    const response = await apiFetch(`/api/tiendas/`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener tiendas:`, errorText)
      throw new Error(`Error al obtener tiendas: ${response.status}`)
    }

    const data = await response.json()
    console.log("Tiendas obtenidas:", data)
    return Array.isArray(data) ? data : data.results || []
  } catch (error) {
    console.error("Error en getTiendasUsuario:", error)
    throw error
  }
}

// Obtener tienda específica por ID
export async function getTiendaById(tiendaId: number): Promise<any> {
  try {
    console.log(`Obteniendo tienda con id=${tiendaId}`)
    
    const response = await apiFetch(`/api/tiendas/${tiendaId}/`, {
      method: "GET",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error ${response.status} al obtener tienda:`, errorText)
      throw new Error(`Error al obtener tienda: ${response.status}`)
    }

    const data = await response.json()
    console.log("Tienda obtenida:", data)
    return data
  } catch (error) {
    console.error("Error en getTiendaById:", error)
    throw error
  }
}

// Validar que la tienda existe y pertenece al usuario actual
export async function validarTiendaDelUsuario(tiendaId: number): Promise<{ existe: boolean; tienda?: any; tiendas?: any[] }> {
  try {
    console.log(`Validando tienda ${tiendaId} para el usuario actual`)
    
    const tiendas = await getTiendasUsuario()
    console.log("Tiendas del usuario:", tiendas)
    
    if (!tiendas || tiendas.length === 0) {
      console.warn("El usuario no tiene tiendas")
      return { existe: false, tiendas: [] }
    }

    // Buscar la tienda en la lista del usuario
    const tiendaEncontrada = tiendas.find((t: any) => t.id === tiendaId || Number(t.id) === Number(tiendaId))
    
    if (tiendaEncontrada) {
      console.log(`Tienda ${tiendaId} encontrada y validada`)
      return { existe: true, tienda: tiendaEncontrada, tiendas }
    } else {
      console.warn(`Tienda ${tiendaId} no pertenece al usuario actual`)
      return { existe: false, tiendas }
    }
  } catch (error) {
    console.error("Error en validarTiendaDelUsuario:", error)
    // Si hay error, retornamos que no existe para ser seguro
    return { existe: false, tiendas: [] }
  }
}

export async function testApiEndpoints(storeId: number): Promise<{ [key: string]: boolean }> {
  const endpoints: { [key: string]: string } = {
    getProductos: `/api/productos/?tienda_id=${storeId}`,
    createProducto: `/api/productos/?tienda_id=${storeId}`,
    getProducto: `/api/productos/1/?tienda_id=${storeId}`, // Usamos un ID fijo para la prueba
    updateProducto: `/api/productos/1/?tienda_id=${storeId}`, // Usamos un ID fijo para la prueba
  }

  const results: { [key: string]: boolean } = {}

  for (const key in endpoints) {
    const endpointUrl = endpoints[key]
    try {
      console.log(`Testing endpoint: ${key} - ${endpointUrl}`)
      const response = await apiFetch(endpointUrl, { method: "GET" })
      results[key] = response.ok
      console.log(`Endpoint ${key} test result: ${response.ok}`)
    } catch (error) {
      console.error(`Error testing endpoint ${key}:`, error)
      results[key] = false
    }
  }

  localStorage.setItem("apiEndpointTests", JSON.stringify(results))
  return results
}
