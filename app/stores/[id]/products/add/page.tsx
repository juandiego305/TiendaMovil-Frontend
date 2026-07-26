"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ImageIcon, Barcode } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { type Producto, createProducto, validarTiendaDelUsuario } from "@/services/product-service"
import BarcodeScanner from "@/components/barcode-scanner"

export default function AddProductPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string
  const { toast } = useToast()

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [storeName, setStoreName] = useState<string>("")
  const [storeExists, setStoreExists] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  const [formData, setFormData] = useState<Producto>({
    nombre: "",
    descripcion: "",
    precio: 0,
    cantidad: 0,
    categoria: "",
    disponible: true,
    tienda_id: Number(storeId),
    codigo_barras: null,
  })

  const [errors, setErrors] = useState({
    nombre: "",
    precio: "",
    cantidad: "",
    categoria: "",
  })

  // Categorías predefinidas
  const categories = ["Frutas", "Verduras", "Lácteos", "Carnes", "Abarrotes", "Bebidas", "Limpieza", "Otros"]

  // Verificar si el usuario está autorizado y si la tienda existe y pertenece al usuario
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType)

    if (!storedUserType) {
      router.push("/")
      return
    }

    // Validar tienda
    const validateStore = async () => {
      try {
        const validacion = await validarTiendaDelUsuario(Number(storeId))
        
        if (validacion.existe && validacion.tienda) {
          // Tienda existe y pertenece al usuario
          setStoreExists(true)
          const tiendaNombre = validacion.tienda.nombre || `Tienda ${storeId}`
          setStoreName(tiendaNombre)
          localStorage.setItem("selectedStoreName", tiendaNombre)
          
          setFormData((prev) => ({
            ...prev,
            tienda_id: Number(storeId),
          }))
        } else {
          // Tienda no existe o no pertenece al usuario
          setStoreExists(false)
          
          // Si hay otras tiendas disponibles, redirigir a la primera
          if (validacion.tiendas && validacion.tiendas.length > 0) {
            const firstStore = validacion.tiendas[0]
            console.log(`Redirigiendo a la tienda disponible: ${firstStore.id}`)
            toast({
              title: "Tienda no encontrada",
              description: `La tienda con ID ${storeId} no existe o no pertenece a ti. Redirigiendo a tu primera tienda...`,
              variant: "destructive",
            })
            
            // Redirigir a la primera tienda disponible
            setTimeout(() => {
              router.push(`/stores/${firstStore.id}/products`)
            }, 2000)
          } else {
            // No hay tiendas disponibles
            toast({
              title: "Error",
              description: "No tienes tiendas disponibles. Crea una tienda primero.",
              variant: "destructive",
            })
            
            setTimeout(() => {
              router.push("/stores")
            }, 2000)
          }
        }
      } catch (error) {
        console.error("Error al validar tienda:", error)
        // Si hay error, asumir que la tienda existe (para no bloquear al usuario)
        setStoreExists(true)
        const selectedStoreName = localStorage.getItem("selectedStoreName")
        if (selectedStoreName) {
          setStoreName(selectedStoreName)
        }
      } finally {
        setIsLoading(false)
      }
    }

    validateStore()

    console.log(`Página de añadir producto inicializada para tienda_id=${storeId}`)
  }, [router, storeId, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Manejar campos numéricos
    if (name === "precio" || name === "cantidad") {
      const numValue = value === "" ? 0 : Number.parseFloat(value)
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }))
    } else {
      // Manejar campos de texto
      setFormData((prev) => ({
        ...prev,
        [name]: name === "codigo_barras" && value === "" ? null : value,
      }))
    }

    // Limpiar error
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      disponible: checked,
    }))
  }

  const handleBarcodeDetected = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      codigo_barras: code,
    }))
    setShowScanner(false)
    toast({
      title: "Código detectado",
      description: `Se ha añadido el código: ${code}`,
    })
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      nombre: "",
      precio: "",
      cantidad: "",
      categoria: "",
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
      isValid = false
    }

    if (formData.precio <= 0) {
      newErrors.precio = "El precio debe ser mayor a 0"
      isValid = false
    }

    if (formData.cantidad < 0) {
      newErrors.cantidad = "La cantidad no puede ser negativa"
      isValid = false
    }

    if (!formData.categoria) {
      newErrors.categoria = "Seleccione una categoría"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Modificar la función goBack para asegurarnos de que vuelve a la página correcta
  const goBack = () => {
    router.push(`/stores/${storeId}/products`)
  }

  // Modificar la función handleSubmit para redirigir a la página correcta después de guardar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !storeExists) {
      return
    }

    setIsSubmitting(true)

    try {
      const productoData = {
        ...formData,
        tienda_id: Number(storeId),
      }

      console.log("Enviando producto:", productoData)

      const createdProduct = await createProducto(productoData)
      console.log("Producto creado con éxito en la API:", createdProduct)

      toast({
        title: "Producto creado",
        description: "El producto ha sido guardado en el servidor",
        variant: "success",
      })

      // Redirigir a la página de productos
      setTimeout(() => {
        router.push(`/stores/${storeId}/products`)
      }, 500)
    } catch (err) {
      console.error("Error al crear el producto:", err)
      
      // Intentar extraer mensaje de error más específico
      let errorMessage = "Error desconocido"
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Si el error contiene JSON, intentar parsearlo
        if (errorMessage.includes("400") || errorMessage.includes("tienda")) {
          try {
            // Buscar JSON en el mensaje de error
            const jsonMatch = errorMessage.match(/\{.*\}/)
            if (jsonMatch) {
              const errorJson = JSON.parse(jsonMatch[0])
              if (errorJson.tienda_id) {
                if (Array.isArray(errorJson.tienda_id)) {
                  errorMessage = `Error con la tienda: ${errorJson.tienda_id[0]}`
                } else {
                  errorMessage = `Error con la tienda: ${errorJson.tienda_id}`
                }
              }
            }
          } catch (parseErr) {
            // Si no se puede parsear, usar el mensaje original
          }
        }
      }
      
      toast({
        title: "Error al crear el producto",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <button onClick={goBack} className="mr-4 p-2 flex items-center justify-center" aria-label="Volver">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Añadir Producto a {storeName}</h1>
      </div>

      <div className="container max-w-md mx-auto p-4">
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800">Verificando tienda...</p>
          </div>
        )}

        {!isLoading && !storeExists && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-semibold">Error: Tienda no encontrada</p>
            <p className="text-red-700 text-sm mt-1">
              La tienda con ID {storeId} no existe. Por favor, selecciona una tienda válida.
            </p>
            <button
              onClick={goBack}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Volver a tiendas
            </button>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} disabled={!storeExists || isLoading}>
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-base">
              Nombre del Producto *
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Manzana Roja"
              className="bg-input-bg border-0 h-12 text-base"
              required
            />
            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio" className="text-base">
              Precio *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base">$</span>
              <Input
                id="precio"
                name="precio"
                value={formData.precio === 0 ? "" : formData.precio}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-input-bg border-0 pl-8 h-12 text-base"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                required
              />
            </div>
            {errors.precio && <p className="text-sm text-red-500">{errors.precio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad" className="text-base">
              Cantidad en inventario *
            </Label>
            <Input
              id="cantidad"
              name="cantidad"
              value={formData.cantidad === 0 ? "" : formData.cantidad}
              onChange={handleChange}
              placeholder="0"
              className="bg-input-bg border-0 h-12 text-base"
              type="number"
              inputMode="numeric"
              min="0"
              required
            />
            {errors.cantidad && <p className="text-sm text-red-500">{errors.cantidad}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_barras" className="text-base">
              Código de Barras (opcional)
            </Label>
            <div className="flex">
              <Input
                id="codigo_barras"
                name="codigo_barras"
                value={formData.codigo_barras || ""}
                onChange={handleChange}
                placeholder="Ej: 7501234567890"
                className="bg-input-bg border-0 h-12 text-base flex-1 mr-2"
              />
              <Button type="button" variant="outline" className="h-12 px-3" onClick={() => setShowScanner(true)}>
                <Barcode className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-base">
              Categoría *
            </Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleSelectChange("categoria", value)}
              required
            >
              <SelectTrigger className="bg-input-bg border-0 h-12 text-base">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-sm text-red-500">{errors.categoria}</p>}
          </div>

          <div className="bg-input-bg rounded-lg p-4 flex flex-col items-center justify-center h-40">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-base text-text-secondary">Añadir imagen</p>
            <p className="text-xs text-text-secondary mt-1">(Funcionalidad no disponible en esta versión)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-base">
              Descripción (opcional)
            </Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion || ""}
              onChange={handleChange}
              placeholder="Descripción del producto"
              className="bg-input-bg border-0 min-h-[100px] text-base"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="disponible" checked={formData.disponible} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="disponible">Producto disponible</Label>
          </div>

          <div className="text-sm text-gray-500 mt-2">* Campos obligatorios</div>

          <Button
            type="submit"
            className="w-full h-14 text-base bg-primary hover:bg-primary-dark mt-6 android-ripple"
            disabled={isSubmitting || !storeExists || isLoading}
          >
            {isLoading ? "Verificando..." : isSubmitting ? "Guardando..." : "Guardar Producto"}
          </Button>
        </form>
      </div>

      {showScanner && <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />}
    </main>
  )
}
