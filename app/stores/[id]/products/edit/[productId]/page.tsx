"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ImageIcon, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getProducto } from "@/services/product-service" // Importar servicios

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

interface ProductFormData {
  id?: number
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  categoria: string
  disponible: boolean
  tienda: number
  oculto?: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string
  const productId = params.productId as string
  const { toast } = useToast()

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [storeName, setStoreName] = useState<string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productNotFound, setProductNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState<ProductFormData>({
    id: Number.parseInt(productId),
    nombre: "",
    descripcion: "",
    precio: 0,
    cantidad: 0,
    categoria: "",
    disponible: true,
    tienda: Number.parseInt(storeId),
  })

  const [errors, setErrors] = useState({
    nombre: "",
    precio: "",
    cantidad: "",
    categoria: "",
  })

  // Categorías predefinidas
  const categories = ["Frutas", "Verduras", "Lácteos", "Carnes", "Abarrotes", "Bebidas", "Limpieza", "Otros"]

  // Verificar si el usuario está autorizado y cargar datos
  useEffect(() => {
    let storedUserType: string | null = null
    try {
      storedUserType = localStorage.getItem("userType")
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
    setUserType(storedUserType)

    if (!storedUserType) {
      router.push("/")
      return
    }

    // Obtener el nombre de la tienda seleccionada
    const selectedStoreName = localStorage.getItem("selectedStoreName")
    if (selectedStoreName) {
      setStoreName(selectedStoreName)
    }

    // Cargar datos del producto
    loadProduct()
  }, [storeId, productId, router])

  // Cargar producto desde API o localStorage
  const loadProduct = async () => {
    setIsLoading(true)
    try {
      // Intentar obtener el producto de la API
      const producto = await getProducto(Number(productId), Number(storeId))

      if (producto) {
        // Adaptar los datos del producto al formato del formulario
        setFormData({
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion || "",
          precio: producto.precio,
          cantidad: producto.cantidad,
          categoria: producto.categoria,
          disponible: producto.cantidad > 0,
          tienda: Number(storeId),
          oculto: producto.oculto || false,
        })
      } else {
        // Si no se encuentra en la API, intentar obtenerlo del localStorage
        fallbackToLocalStorage()
      }
    } catch (error) {
      console.error("Error al cargar el producto:", error)
      // Si hay un error, intentar obtenerlo del localStorage
      fallbackToLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  // Función de respaldo para cargar desde localStorage
  const fallbackToLocalStorage = () => {
    console.log("Intentando cargar producto desde localStorage")
    const storedProducts = localStorage.getItem(`store_${storeId}_products`)

    if (storedProducts) {
      const products = JSON.parse(storedProducts)
      const product = products.find((p: ProductFormData) => p.id === Number(productId))

      if (product) {
        console.log("Producto encontrado en localStorage:", product)
        setFormData(product)
      } else {
        console.log("Producto no encontrado en localStorage")
        setProductNotFound(true)
      }
    } else {
      console.log("No hay productos almacenados en localStorage")
      setProductNotFound(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "precio" || name === "cantidad" ? Number.parseFloat(value) || 0 : value,
    }))

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

  // Modificar la función handleSubmit para manejar el error 403 y actualizar solo localStorage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar los datos para la API
      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || "",
        precio: formData.precio,
        cantidad: formData.cantidad,
        categoria: formData.categoria,
        codigo_barras: null,
        tienda_id: Number(storeId),
      }

      let apiSuccess = false

      try {
        // Intentar actualizar en la API
        const response = await fetch(
          `${API_BASE_URL}/api/productos/${productId}/?tienda_id=${storeId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(productoData),
          },
        )

        if (response.ok) {
          apiSuccess = true
        } else {
          console.log("API update failed, falling back to localStorage only")
        }
      } catch (apiError) {
        console.error("Error al comunicarse con la API:", apiError)
      }

      // Siempre actualizar en localStorage para mantener la UI consistente
      const storedProducts = localStorage.getItem(`store_${storeId}_products`)
      if (storedProducts) {
        const products = JSON.parse(storedProducts)
        const updatedProducts = products.map((p: ProductFormData) =>
          p.id === Number(productId) ? { ...formData, disponible: formData.disponible } : p,
        )
        localStorage.setItem(`store_${storeId}_products`, JSON.stringify(updatedProducts))
      }

      toast({
        title: "Producto actualizado",
        description: apiSuccess
          ? "El producto ha sido actualizado con éxito en el servidor"
          : "El producto ha sido actualizado localmente",
        variant: "success",
      })

      setTimeout(() => {
        router.push(`/stores/${storeId}/products`)
      }, 1000)
    } catch (err) {
      console.error("Error al actualizar el producto:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    setIsDeleting(true)

    try {
      // Obtener productos actuales
      const storedProducts = localStorage.getItem(`store_${storeId}_products`)
      if (storedProducts) {
        const products = JSON.parse(storedProducts)

        // En lugar de eliminar, marcar como oculto
        const updatedProducts = products.map((p: ProductFormData) => {
          if (p.id === Number(productId)) {
            return { ...p, oculto: true }
          }
          return p
        })

        // Guardar en localStorage
        localStorage.setItem(`store_${storeId}_products`, JSON.stringify(updatedProducts))

        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado con éxito",
          variant: "success",
        })

        setTimeout(() => {
          router.push(`/stores/${storeId}/products`)
        }, 1000)
      }
    } catch (err) {
      console.error("Error al eliminar el producto:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href={`/stores/${storeId}/products`} className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Cargando producto...</h1>
        </div>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    )
  }

  if (productNotFound) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href={`/stores/${storeId}/products`} className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Producto no encontrado</h1>
        </div>
        <div className="container max-w-md mx-auto p-4 text-center">
          <div className="bg-white rounded-lg p-8">
            <p className="text-text-secondary mb-4">El producto que buscas no existe o ha sido eliminado</p>
            <Button
              onClick={() => router.push(`/stores/${storeId}/products`)}
              className="bg-primary hover:bg-primary-dark"
            >
              Volver a productos
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href={`/stores/${storeId}/products`} className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Editar Producto</h1>
      </div>

      <div className="container max-w-md mx-auto p-4">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-base">
              Nombre del Producto
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Manzana Roja"
              className="bg-input-bg border-0 h-12 text-base"
            />
            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio" className="text-base">
              Precio
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base">$</span>
              <Input
                id="precio"
                name="precio"
                value={formData.precio || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-input-bg border-0 pl-8 h-12 text-base"
                type="number"
                inputMode="decimal"
                min="0"
                step="100"
              />
            </div>
            {errors.precio && <p className="text-sm text-red-500">{errors.precio}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad" className="text-base">
              Cantidad en inventario
            </Label>
            <Input
              id="cantidad"
              name="cantidad"
              value={formData.cantidad || ""}
              onChange={handleChange}
              placeholder="0"
              className="bg-input-bg border-0 h-12 text-base"
              type="number"
              inputMode="numeric"
              min="0"
            />
            {errors.cantidad && <p className="text-sm text-red-500">{errors.cantidad}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-base">
              Categoría
            </Label>
            <Select value={formData.categoria} onValueChange={(value) => handleSelectChange("categoria", value)}>
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
            <p className="text-base text-text-secondary">Cambiar imagen</p>
            <p className="text-xs text-text-secondary mt-1">(Funcionalidad no disponible en esta versión)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-base">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Descripción del producto"
              className="bg-input-bg border-0 min-h-[100px] text-base"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="disponible" checked={formData.disponible} onCheckedChange={handleSwitchChange} />
            <Label htmlFor="disponible">Producto disponible</Label>
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              type="submit"
              className="flex-1 h-14 text-base bg-primary hover:bg-primary-dark shadow-soft"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-14 aspect-square flex items-center justify-center"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar Producto</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </div>
    </main>
  )
}
