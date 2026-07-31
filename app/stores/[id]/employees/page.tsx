"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Search, User } from "lucide-react"

import { BottomNavigation } from "@/components/bottom-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

interface StoreVendor {
  id: number
  username: string
  email: string
  telefono: string
  asignado: boolean
  tienda_asignada_id: number | null
  tienda_asignada_nombre: string | null
  puede_asignarse: boolean
}

const toText = (value: unknown) => {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

const normalizeVendor = (vendor: Record<string, any>, storeId: string): StoreVendor => {
  const assignedStoreId =
    vendor.tienda_asignada_id ?? vendor.store_id ?? vendor.tienda_id ?? vendor.tienda?.id ?? vendor.tienda ?? null
  const assignedStoreName =
    vendor.tienda_asignada_nombre ?? vendor.store_name ?? vendor.tienda_nombre ?? vendor.tienda?.nombre ?? null
  const assigned =
    Boolean(vendor.asignado ?? vendor.assigned ?? vendor.esta_asignado ?? vendor.tiene_tienda ?? assignedStoreId)
  const canAssign =
    vendor.puede_asignarse ?? vendor.can_assign ?? vendor.puedeAsignarse ?? (!assigned || String(assignedStoreId) === storeId)

  return {
    id: Number(vendor.id ?? vendor.usuario_id ?? vendor.user_id ?? 0),
    username: toText(vendor.username ?? vendor.nombre_usuario ?? vendor.nombre ?? vendor.user?.username ?? ""),
    email: toText(vendor.email ?? vendor.correo ?? vendor.user?.email ?? ""),
    telefono: toText(vendor.telefono ?? vendor.phone ?? vendor.celular ?? vendor.user?.telefono ?? ""),
    asignado: assigned,
    tienda_asignada_id: assignedStoreId !== null && assignedStoreId !== undefined ? Number(assignedStoreId) : null,
    tienda_asignada_nombre: assignedStoreName ? String(assignedStoreName) : null,
    puede_asignarse: Boolean(canAssign),
  }
}

export default function StoreEmployeesPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string
  const { toast } = useToast()

  const [vendors, setVendors] = useState<StoreVendor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [storeName, setStoreName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [assigningVendorId, setAssigningVendorId] = useState<number | null>(null)

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")

    if (storedUserType !== "admin") {
      router.push("/")
      return
    }

    const selectedStoreName = localStorage.getItem("selectedStoreName")
    if (selectedStoreName) {
      setStoreName(selectedStoreName)
    }

    loadVendors()
  }, [router, storeId])

  const loadVendors = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/tiendas/${storeId}/vendedores/`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`No se pudieron cargar los vendedores: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const responseData = await response.json()
      const rawVendors = Array.isArray(responseData)
        ? responseData
        : responseData.vendedores || responseData.employees || responseData.empleados || responseData.results || []

      setVendors(rawVendors.map((vendor: Record<string, any>) => normalizeVendor(vendor, storeId)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los vendedores")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    return (
      vendor.username.toLowerCase().includes(query) ||
      vendor.email.toLowerCase().includes(query) ||
      vendor.telefono.toLowerCase().includes(query) ||
      (vendor.tienda_asignada_nombre || "").toLowerCase().includes(query)
    )
  })

  const handleAssignVendor = async (vendor: StoreVendor) => {
    if (vendor.asignado || !vendor.puede_asignarse) {
      return
    }

    setAssigningVendorId(vendor.id)
    setError(null)

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/tiendas/${storeId}/agregar_empleado/`, {
        method: "POST",
        body: JSON.stringify({ usuario_id: vendor.id }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`No se pudo asignar el vendedor: ${response.status} ${response.statusText}. ${errorText}`)
      }

      await loadVendors()
      toast({
        title: "Vendedor agregado",
        description: `${vendor.username || "El vendedor"} fue agregado a la tienda`,
        variant: "success",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo asignar el vendedor"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setAssigningVendorId(null)
    }
  }

  const isSameStore = (vendor: StoreVendor) =>
    vendor.tienda_asignada_id !== null && String(vendor.tienda_asignada_id) === String(storeId)

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top has-bottom-nav">
      <div className="bg-primary text-white p-5">
        <div className="flex items-center mb-2">
          <Link href="/home" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Vendedores de {storeName || `Tienda ${storeId}`}</h1>
        </div>
        <p className="text-sm opacity-80 mt-1">Selecciona un vendedor registrado y agrégalo a esta tienda</p>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary h-5 w-5" />
            <Input
              placeholder="Buscar por usuario, correo, teléfono o tienda"
              className="pl-10 bg-input-bg border-0 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-text-secondary">Cargando vendedores registrados...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-red-500 text-sm">{error}</p>
              <Button onClick={loadVendors} className="bg-primary hover:bg-primary-dark">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : filteredVendors.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-text-secondary mb-2">No hay vendedores que coincidan con tu búsqueda</p>
              <p className="text-sm text-text-secondary">La lista se obtiene desde /api/tiendas/{storeId}/vendedores/</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVendors.map((vendor) => {
              const sameStore = isSameStore(vendor)
              const assignedElsewhere = vendor.asignado && !sameStore
              const available = vendor.puede_asignarse && !vendor.asignado

              return (
                <Card key={vendor.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-medium">{vendor.username || `Usuario ${vendor.id}`}</h3>
                        <p className="text-sm text-text-secondary">{vendor.email || "Sin correo registrado"}</p>
                        <p className="text-sm text-text-secondary">{vendor.telefono || "Sin teléfono registrado"}</p>
                      </div>
                      <Badge variant={available ? "default" : "secondary"}>{available ? "Disponible" : "Asignado"}</Badge>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                      <p>
                        <span className="font-medium">Estado:</span> {available ? "Puede agregarse a la tienda" : "No disponible"}
                      </p>
                      <p>
                        <span className="font-medium">Tienda asignada:</span> {vendor.tienda_asignada_nombre || (vendor.tienda_asignada_id ? `Tienda ${vendor.tienda_asignada_id}` : "Sin asignar")}
                      </p>
                      {sameStore && <p className="text-amber-600">Este vendedor ya está asignado a esta misma tienda.</p>}
                      {assignedElsewhere && <p className="text-amber-600">Este vendedor ya está asignado a otra tienda.</p>}
                    </div>

                    {available ? (
                      <Button
                        className="w-full h-11 bg-primary hover:bg-primary-dark"
                        onClick={() => handleAssignVendor(vendor)}
                        disabled={assigningVendorId === vendor.id}
                      >
                        {assigningVendorId === vendor.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Agregando...
                          </>
                        ) : (
                          "Agregar a la tienda"
                        )}
                      </Button>
                    ) : (
                      <Button className="w-full h-11" variant="outline" disabled>
                        {sameStore ? "Ya está en esta tienda" : "No se puede asignar"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  )
}