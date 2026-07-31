"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/utils"
import { getApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = getApiBaseUrl()

interface CajaData {
  id: number
  usuario: number
  turno: string
  saldo_inicial: string
  saldo_final: string
  fecha_apertura: string
  fecha_cierre: string
  estado: string
}

export default function EditCajaPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string
  const cajaId = params.cajaId as string

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [storeName, setStoreName] = useState<string>("")
  const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CajaData>({
    id: Number.parseInt(cajaId),
    usuario: 0,
    turno: "",
    saldo_inicial: "0",
    saldo_final: "0",
    fecha_apertura: new Date().toISOString(),
    fecha_cierre: new Date().toISOString(),
    estado: "abierta",
  })

  const [errors, setErrors] = useState({
    usuario: "",
    turno: "",
    saldo_inicial: "",
    saldo_final: "",
    estado: "",
  })

  // Turnos predefinidos
  const turnos = ["mañana", "tarde", "noche"]

  // Estados predefinidos
  const estados = ["abierta", "cerrada"]

  // Función para seleccionar la tienda
  const selectStore = async () => {
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
      setError(`No se pudo seleccionar la tienda: ${err instanceof Error ? err.message : "Error desconocido"}`)
      return false
    }
  }

  // Cargar usuarios (empleados) de la tienda
  const fetchUsuarios = async () => {
    try {
      // Generar usuarios de ejemplo en lugar de cargarlos del backend
      const empleadosEjemplo = [
        { id: 101, nombre: "Carlos Rodríguez" },
        { id: 102, nombre: "María López" },
        { id: 103, nombre: "Juan Pérez" },
        { id: 104, nombre: "Ana Martínez" },
        { id: 105, nombre: "Luis González" },
      ]

      setUsuarios(empleadosEjemplo)
    } catch (err) {
      console.error("Error al cargar los empleados:", err)
      setError(`No se pudieron cargar los empleados: ${err instanceof Error ? err.message : "Error desconocido"}`)
    }
  }

  // Obtener datos de la caja
  const fetchCaja = async () => {
    try {
      console.log(`Obteniendo caja con ID: ${cajaId}`)
      const response = await fetchWithAuth(`${API_BASE_URL}/api/cajas/${cajaId}/`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al obtener caja: ${response.status} - ${response.statusText}`, errorText)
        throw new Error(`Error al obtener caja: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos de caja obtenidos:", data)

      setFormData({
        id: data.id,
        usuario: data.usuario,
        turno: data.turno || "",
        saldo_inicial: data.saldo_inicial || "0",
        saldo_final: data.saldo_final || "0",
        fecha_apertura: data.fecha_apertura || new Date().toISOString(),
        fecha_cierre: data.fecha_cierre || new Date().toISOString(),
        estado: data.estado || "abierta",
      })
    } catch (err) {
      console.error("Error al cargar la caja:", err)
      setError(
        `No se pudo cargar la información de la caja: ${err instanceof Error ? err.message : "Error desconocido"}`,
      )
    }
  }

  // Verificar si el usuario está autorizado y cargar datos
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType)

    if (storedUserType !== "admin") {
      router.push("/")
      return
    }

    // Obtener el nombre de la tienda seleccionada
    const selectedStoreName = localStorage.getItem("selectedStoreName")
    if (selectedStoreName) {
      setStoreName(selectedStoreName)
    }

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Primero seleccionar la tienda
        const storeSelected = await selectStore()
        if (!storeSelected) {
          setIsLoading(false)
          return
        }

        // Cargar usuarios y datos de la caja en paralelo
        await Promise.all([fetchUsuarios(), fetchCaja()])
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError(`Error al cargar datos: ${err instanceof Error ? err.message : "Error desconocido"}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [storeId, cajaId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "saldo_inicial" || name === "saldo_final" ? value.replace(/[^0-9.]/g, "") : value,
    }))

    // Limpiar error
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleSelectChange = (name: string, value: string | number) => {
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

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      usuario: "",
      turno: "",
      saldo_inicial: "",
      saldo_final: "",
      estado: "",
    }

    if (!formData.usuario) {
      newErrors.usuario = "Seleccione un usuario"
      isValid = false
    }

    if (!formData.turno) {
      newErrors.turno = "Seleccione un turno"
      isValid = false
    }

    if (!formData.saldo_inicial) {
      newErrors.saldo_inicial = "El saldo inicial es obligatorio"
      isValid = false
    }

    if (!formData.estado) {
      newErrors.estado = "Seleccione un estado"
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
      // Primero seleccionar la tienda
      const storeSelected = await selectStore()
      if (!storeSelected) {
        setIsSubmitting(false)
        return
      }

      // Preparar datos para enviar
      const cajaData = {
        ...formData,
        // Si el estado cambia a cerrada y no hay fecha de cierre, añadir la fecha actual
        fecha_cierre:
          formData.estado === "cerrada" && !formData.fecha_cierre ? new Date().toISOString() : formData.fecha_cierre,
      }

      console.log("Actualizando caja:", cajaData)

      const response = await fetchWithAuth(`${API_BASE_URL}/api/cajas/${cajaId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cajaData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al actualizar caja: ${response.status} - ${response.statusText}`, errorText)
        throw new Error(`Error al actualizar caja: ${response.status} - ${response.statusText}`)
      }

      alert("Caja actualizada con éxito")
      router.push(`/stores/${storeId}/cajas`)
    } catch (err) {
      console.error("Error al actualizar la caja:", err)
      alert(
        `No se pudo actualizar la caja: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-light">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-primary">Cargando información de la caja...</p>
      </div>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
        <div className="bg-white p-4 flex items-center">
          <Link href={`/stores/${storeId}/cajas`} className="mr-4">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold">Editar Caja</h1>
        </div>

        <div className="container max-w-md mx-auto p-4 text-center">
          <div className="bg-white rounded-lg p-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark">
              Reintentar
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href={`/stores/${storeId}/cajas`} className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Editar Caja</h1>
      </div>

      <div className="container max-w-md mx-auto p-4">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-base">
              Usuario
            </Label>
            <Select
              value={formData.usuario.toString()}
              onValueChange={(value) => handleSelectChange("usuario", Number.parseInt(value))}
            >
              <SelectTrigger className="bg-input-bg border-0 h-12 text-base">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id.toString()}>
                    {usuario.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.usuario && <p className="text-sm text-red-500">{errors.usuario}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno" className="text-base">
              Turno
            </Label>
            <Select value={formData.turno} onValueChange={(value) => handleSelectChange("turno", value)}>
              <SelectTrigger className="bg-input-bg border-0 h-12 text-base">
                <SelectValue placeholder="Seleccionar turno" />
              </SelectTrigger>
              <SelectContent>
                {turnos.map((turno) => (
                  <SelectItem key={turno} value={turno}>
                    {turno.charAt(0).toUpperCase() + turno.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.turno && <p className="text-sm text-red-500">{errors.turno}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldo_inicial" className="text-base">
              Saldo Inicial
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base">$</span>
              <Input
                id="saldo_inicial"
                name="saldo_inicial"
                value={formData.saldo_inicial}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-input-bg border-0 pl-8 h-12 text-base"
                type="text"
                inputMode="decimal"
              />
            </div>
            {errors.saldo_inicial && <p className="text-sm text-red-500">{errors.saldo_inicial}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldo_final" className="text-base">
              Saldo Final
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base">$</span>
              <Input
                id="saldo_final"
                name="saldo_final"
                value={formData.saldo_final}
                onChange={handleChange}
                placeholder="0.00"
                className="bg-input-bg border-0 pl-8 h-12 text-base"
                type="text"
                inputMode="decimal"
              />
            </div>
            {errors.saldo_final && <p className="text-sm text-red-500">{errors.saldo_final}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado" className="text-base">
              Estado
            </Label>
            <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
              <SelectTrigger className="bg-input-bg border-0 h-12 text-base">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.estado && <p className="text-sm text-red-500">{errors.estado}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base bg-primary hover:bg-primary-dark mt-6 android-ripple"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Actualizar Caja"
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}

