"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Filter, Plus, Search, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
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
import { getProductsByStore } from "@/services/product-service" // Importar el servicio de productos

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  cantidad: number
  categoria: string
  disponible: boolean
  tienda: number
  codigo_barras?: string
  imagen?: string
  tienda_id?: number
  oculto?: boolean
}

export default function ProductsPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string
  const { toast } = useToast()

  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [storeName, setStoreName] = useState<string>("")
  const [categories, setCategories] = useState<string[]>([])
  const [nextId, setNextId] = useState(1) // Para generar IDs únicos
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Cargar productos
  useEffect(() => {
    // Verificar si el usuario está autorizado
    const userType = localStorage.getItem("userType")
    if (!userType) {
      router.push("/")
      return
    }

    // Obtener el nombre de la tienda seleccionada
    const selectedStoreName = localStorage.getItem("selectedStoreName")
    if (selectedStoreName) {
      setStoreName(selectedStoreName)
    }

    // Cargar productos
    loadProducts()
  }, [storeId, router])

  // Cargar productos desde el backend
  const loadProducts = async () => {
    setIsLoading(true)

    try {
      // Obtener productos del backend
      const fetchedProducts = await getProductsByStore(storeId)

      // Adaptar la estructura de los productos
      const adaptedProducts = fetchedProducts.map((p) => ({
        id: p.id || 0,
        nombre: p.nombre,
        descripcion: p.descripcion || "",
        precio: p.precio,
        cantidad: p.cantidad,
        categoria: p.categoria,
        disponible: p.cantidad > 0,
        tienda: Number(p.tienda_id),
        codigo_barras: p.codigo_barras || "",
        imagen: p.imagen,
        oculto: p.oculto || false, // Asegurarse de que el campo oculto esté presente
      }))

      setProductos(adaptedProducts)
      setFilteredProductos(adaptedProducts.filter((p) => !p.oculto)) // Filtrar productos ocultos

      // Extraer categorías únicas
      const uniqueCategories = Array.from(
        new Set(adaptedProducts.filter((p) => !p.oculto).map((producto: Producto) => producto.categoria)),
      ) as string[]

      setCategories(["Todos", ...uniqueCategories])

      // Encontrar el ID más alto para nuevos productos
      if (adaptedProducts.length > 0) {
        setNextId(Math.max(...adaptedProducts.map((p) => p.id)) + 1)
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos del servidor. Usando datos en caché si están disponibles.",
        variant: "destructive",
      })

      // Fallback a localStorage si el endpoint falla
      const storedProducts = localStorage.getItem(`store_${storeId}_products`)
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts) as Producto[]
        setProductos(parsedProducts)
        setFilteredProductos(parsedProducts.filter((p) => !p.oculto)) // Filtrar productos ocultos

        // Extraer categorías únicas - Corregido el error de tipado
        const uniqueCategories = Array.from(
          new Set(parsedProducts.filter((p) => !p.oculto).map((producto: Producto) => producto.categoria)),
        ) as string[]

        setCategories(["Todos", ...uniqueCategories])

        if (parsedProducts.length > 0) {
          setNextId(Math.max(...parsedProducts.map((p: Producto) => p.id)) + 1)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar productos cuando cambia el término de búsqueda o filtros
  useEffect(() => {
    let filtered = [...productos].filter((producto) => !producto.oculto) // Filtrar productos ocultos

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por disponibilidad
    if (showOnlyAvailable) {
      filtered = filtered.filter((producto) => producto.disponible)
    }

    // Filtrar por categoría
    if (activeCategory !== "Todos") {
      filtered = filtered.filter((producto) => producto.categoria === activeCategory)
    }

    setFilteredProductos(filtered)
  }, [searchTerm, showOnlyAvailable, activeCategory, productos])

  const toggleAvailableFilter = () => {
    setShowOnlyAvailable(!showOnlyAvailable)
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(price)
  }

  // Función para navegar a la página de añadir producto
  const navigateToAddProduct = () => {
    router.push(`/stores/${storeId}/products/add`)
  }

  // Función para volver a la página de la tienda
  const goBackToStore = () => {
    router.push("/home")
  }

  // Función para editar un producto
  const handleEditProduct = (e: React.MouseEvent, productId: number) => {
    e.preventDefault() // Prevenir la navegación del Link
    e.stopPropagation() // Evitar que el evento se propague
    router.push(`/stores/${storeId}/products/edit/${productId}`)
  }

  // Función para confirmar eliminación
  const confirmDelete = (e: React.MouseEvent, productId: number) => {
    e.preventDefault() // Prevenir la navegación del Link
    e.stopPropagation() // Evitar que el evento se propague
    setProductToDelete(productId)
    setIsDeleteDialogOpen(true)
  }

  // Función para eliminar un producto (marcarlo como oculto)
  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    setIsDeleting(true)

    try {
      // Obtener productos actuales
      const storedProducts = localStorage.getItem(`store_${storeId}_products`)
      if (storedProducts) {
        const products = JSON.parse(storedProducts)

        // En lugar de eliminar, marcar como oculto
        const updatedProducts = products.map((p: Producto) => {
          if (p.id === productToDelete) {
            return { ...p, oculto: true }
          }
          return p
        })

        // Guardar en localStorage
        localStorage.setItem(`store_${storeId}_products`, JSON.stringify(updatedProducts))

        // Actualizar el estado local para reflejar el cambio sin recargar
        setProductos(updatedProducts)

        // Actualizar los productos filtrados para eliminar el producto oculto
        setFilteredProductos((prevFiltered) => prevFiltered.filter((p) => p.id !== productToDelete))

        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado con éxito",
          variant: "success",
        })
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
      setProductToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-light">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-primary">Cargando productos...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <button
          onClick={goBackToStore}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Volver a la tienda"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Productos de {storeName}</h1>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10 bg-input-bg border-0 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-surface shadow-soft border-border-medium hover:bg-surface-hover"
              >
                <Filter className="h-5 w-5 text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filtrar productos</DialogTitle>
                <DialogDescription>Selecciona las opciones para filtrar los productos</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={showOnlyAvailable}
                    onChange={toggleAvailableFilter}
                    className="h-4 w-4 rounded border-border-medium text-primary focus:ring-primary"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-text-primary">
                    Mostrar solo productos disponibles
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="default"
            size="icon"
            className="bg-primary hover:bg-primary-dark shadow-soft"
            onClick={navigateToAddProduct}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {categories.length > 1 && (
          <Tabs defaultValue="Todos" className="mb-4">
            <TabsList className="bg-white overflow-x-auto flex w-full justify-start p-0 h-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 ${activeCategory === category ? "bg-primary text-white" : "bg-white text-text-primary"} rounded-full text-sm`}
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {filteredProductos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-secondary mb-2">No se encontraron productos</p>
            <Button className="mt-4 bg-primary hover:bg-primary-dark" onClick={navigateToAddProduct}>
              Añadir producto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProductos.map((producto) => (
              <Link key={producto.id} href={`/stores/${storeId}/products/edit/${producto.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow relative">
                  <CardContent className="p-0">
                    <div className="bg-gray-100 h-40 flex items-center justify-center">
                      <div className="text-4xl text-gray-400">📦</div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{producto.nombre}</h3>
                        <Badge
                          variant={producto.disponible ? "default" : "secondary"}
                          className={producto.disponible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {producto.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                      <p className="text-text-secondary text-sm line-clamp-2 mb-2">
                        {producto.descripcion || "Sin descripción"}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">{formatPrice(producto.precio)}</span>
                        <span className="text-sm text-text-secondary">Stock: {producto.cantidad}</span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="bg-gray-100 text-text-secondary">
                          {producto.categoria}
                        </Badge>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-primary text-primary"
                          onClick={(e) => handleEditProduct(e, producto.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-red-500 text-red-500"
                          onClick={(e) => confirmDelete(e, producto.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
