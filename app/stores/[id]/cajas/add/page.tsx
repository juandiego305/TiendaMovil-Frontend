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

interface CajaFormData {
  turno: string
  saldo_inicial: string
}

export default function AddCajaPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [userType, setUserType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeName, setStoreName] = useState<string>("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [formData, setFormData] = useState<CajaFormData>({
    turno: "",
    saldo_inicial: "0",
  })

  const [errors, setErrors] = useState({
    turno: "",
    saldo_inicial: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "saldo_inicial" ? value.replace(/[^0-9.]/g, "") : value,
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
      turno: "",
      saldo_inicial: "",
    }

    if (!formData.turno) {
      newErrors.turno = "Seleccione un turno"
      isValid = false
    }

    if (!formData.saldo_inicial) {
      newErrors.saldo_inicial = "El saldo inicial es obligatorio"
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
      const storeSelected = await selectStore()
      if (!storeSelected) {
        setIsSubmitting(false)
        return
      }

      const cajaData = {
        tienda_id: Number(storeId),
        turno: formData.turno,
        saldo_inicial: Number.parseFloat(formData.saldo_inicial),
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

