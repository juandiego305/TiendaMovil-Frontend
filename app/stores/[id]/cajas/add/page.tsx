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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

interface CajaFormData {
  usuario: number
  turno: string
  saldo_inicial: string
  saldo_final: string
  estado: string
}

export default function AddCajaPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeName, setStoreName] = useState<string>("")
  const [usuarios, setUsuarios] = useState<{ id: number; nombre: string }[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

  const [formData, setFormData] = useState<CajaFormData>({
    usuario: 0,
    turno: "",
    saldo_inicial: "0",
    saldo_final: "0",
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

  // Verificar si el usuario está autorizado
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

    // Cargar usuarios (empleados) de la tienda
    fetchUsuarios()
  }, [router])

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
      alert(
        `No se pudo seleccionar la tienda: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
      )
      return false
    }
  }

  // Cargar usuarios (empleados) de la tienda
  const fetchUsuarios = async () => {
    setIsLoadingUsers(true)
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

      // Si hay empleados, seleccionar el primero por defecto
      if (empleadosEjemplo.length > 0) {
        setFormData((prev) => ({
          ...prev,
          usuario: empleadosEjemplo[0].id,
        }))
      }
    } catch (err) {
      console.error("Error al cargar los empleados:", err)
      alert(`No se pudieron cargar los empleados: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setIsLoadingUsers(false)
    }
  }

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
        // Convertir saldos a números si es necesario
        saldo_inicial: formData.saldo_inicial,
        saldo_final: formData.saldo_final,
        // Añadir fechas actuales si no se proporcionan
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: formData.estado === "cerrada" ? new Date().toISOString() : null,
      }

      console.log("Creando nueva caja:", cajaData)

      const response = await fetchWithAuth(`${API_BASE_URL}/api/cajas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cajaData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al crear caja: ${response.status} - ${response.statusText}`, errorText)
        throw new Error(`Error al crear caja: ${response.status} - ${response.statusText}`)
      }

      alert("Caja creada con éxito")
      router.push(`/stores/${storeId}/cajas`)
    } catch (err) {
      console.error("Error al crear la caja:", err)
      alert(
        `No se pudo crear la caja: ${err instanceof Error ? err.message : "Error desconocido"}. Por favor, intenta de nuevo más tarde.`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingUsers) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-light">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-text-primary">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href={`/stores/${storeId}/cajas`} className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Añadir Caja a {storeName}</h1>
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
              "Crear Caja"
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}

