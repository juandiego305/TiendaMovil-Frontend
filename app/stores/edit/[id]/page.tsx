"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Store } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { fetchWithAuth } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

interface StoreData {
  id: string
  nombre: string
  direccion: string
  telefono: string
  descripcion: string
  imagen?: string
  fecha_creacion?: string
}

export default function EditStorePage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [storeNotFound, setStoreNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<StoreData>({
    id: storeId,
    nombre: "",
    direccion: "",
    telefono: "",
    descripcion: "",
  })

  const [errors, setErrors] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
  })

  // Verificar si el usuario es administrador y cargar datos de la tienda
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType)

    if (storedUserType !== "admin") {
      // Redirigir a la página de inicio si no es administrador
      router.push("/")
      return
    }

    // Función para cargar los datos de la tienda
    const fetchStore = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log(`Obteniendo datos de la tienda con ID: ${storeId}`)
        const response = await fetchWithAuth(`${API_BASE_URL}/api/tiendas/${storeId}/`)

        if (!response.ok) {
          if (response.status === 404) {
            setStoreNotFound(true)
          } else {
            throw new Error(`Error: ${response.status} - ${response.statusText}`)
          }
        } else {
          const data = await response.json()
          console.log("Datos de tienda obtenidos:", data)
          setFormData({
            id: data.id,
            nombre: data.nombre || "",
            direccion: data.direccion || "",
            telefono: data.telefono || "",
            descripcion: data.descripcion || "",
          })
        }
      } catch (err) {
        console.error("Error al cargar la tienda:", err)
        setError(
          `No se pudo cargar la información de la tienda: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchStore()
  }, [router, storeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar error
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      nombre: "",
      direccion: "",
      telefono: "",
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio"
      isValid = false
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria"
      isValid = false
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Asegurarnos de enviar solo los campos necesarios
      const updateData = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        telefono: formData.telefono,
        descripcion: formData.descripcion,
      }

      console.log(`Actualizando tienda ${storeId} con datos:`, updateData)

      const response = await fetchWithAuth(`${API_BASE_URL}/api/tiendas/${storeId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error: ${response.status} - ${response.statusText} - ${errorText}`)
      }

      alert("Tienda actualizada con éxito")
      router.push("/stores")
    } catch (err) {
      console.error("Error al actualizar la tienda:", err)
      alert(
        `No se pudo actualizar la tienda: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userType !== "admin") {
    return null // No renderizar nada mientras se verifica o redirige
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href="/stores" className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Editar Tienda</h1>
        </div>
        <div className="container max-w-md mx-auto p-4 text-center">
          <p className="text-text-secondary">Cargando información de la tienda...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href="/stores" className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Editar Tienda</h1>
        </div>
        <div className="container max-w-md mx-auto p-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark">
            Reintentar
          </Button>
        </div>
      </main>
    )
  }

  if (storeNotFound) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href="/stores" className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Editar Tienda</h1>
        </div>

        <div className="container max-w-md mx-auto p-4 text-center">
          <div className="bg-white rounded-lg p-8">
            <p className="text-text-secondary mb-4">Tienda no encontrada</p>
            <Button onClick={() => router.push("/stores")} className="bg-primary hover:bg-primary-dark">
              Volver a tiendas
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href="/stores" className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Editar Tienda</h1>
      </div>

      <div className="container max-w-md mx-auto p-4">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-base">
              Nombre de la Tienda
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Tienda Principal"
              className="bg-input-bg border-0 h-12 text-base"
            />
            {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion" className="text-base">
              Dirección
            </Label>
            <Input
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Calle 123 #45-67"
              className="bg-input-bg border-0 h-12 text-base"
            />
            {errors.direccion && <p className="text-sm text-red-500">{errors.direccion}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-base">
              Teléfono
            </Label>
            <Input
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: +57 3124567890"
              className="bg-input-bg border-0 h-12 text-base"
              type="tel"
            />
            {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
          </div>

          <div className="bg-input-bg rounded-lg p-4 flex flex-col items-center justify-center h-40">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2">
              <Store className="h-6 w-6 text-primary" />
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
              placeholder="Descripción de la tienda"
              className="bg-input-bg border-0 min-h-[100px] text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base bg-primary hover:bg-primary-dark mt-6 android-ripple"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Actualizar Tienda"}
          </Button>
        </form>
      </div>
    </main>
  )
}

