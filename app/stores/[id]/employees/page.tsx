"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Plus, Search, User, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

// Interfaz para los empleados
interface Employee {
  id: number
  nombre: string
  email?: string
  telefono?: string
  cargo?: string
  activo: boolean
}

// Datos de ejemplo para empleados
const generateSampleEmployees = (): Employee[] => {
  return [
    {
      id: 1,
      nombre: "Juan Pérez",
      email: "juan@tiendamixta.com",
      telefono: "+57 3124567890",
      cargo: "Vendedor Senior",
      activo: true,
    },
    {
      id: 2,
      nombre: "María López",
      email: "maria@tiendamixta.com",
      telefono: "+57 3209876543",
      cargo: "Vendedor",
      activo: true,
    },
    {
      id: 3,
      nombre: "Carlos Rodríguez",
      email: "carlos@tiendamixta.com",
      telefono: "+57 3157894561",
      cargo: "Vendedor",
      activo: true,
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      email: "ana@tiendamixta.com",
      telefono: "+57 3112345678",
      cargo: "Vendedor Junior",
      activo: true,
    },
  ]
}

export default function StoreEmployeesPage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string
  const { toast } = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [userType, setUserType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [storeName, setStoreName] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [newEmployeePhone, setNewEmployeePhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar si el usuario es administrador
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    setUserType(storedUserType)

    if (storedUserType !== "admin") {
      // Redirigir a la página de inicio si no es administrador
      router.push("/")
      return
    }

    // Obtener el nombre de la tienda seleccionada
    const selectedStoreName = localStorage.getItem("selectedStoreName")
    if (selectedStoreName) {
      setStoreName(selectedStoreName)
    }

    // Cargar empleados desde localStorage o generar datos de ejemplo
    fetchEmployees()
  }, [router, storeId])

  // Corregir la función fetchEmployees para usar el endpoint correcto y procesar la respuesta adecuadamente
  const fetchEmployees = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Obtener token directamente
      const token = localStorage.getItem("backendToken")
      if (!token) {
        throw new Error("No hay token de autenticación disponible")
      }

      // Usar el endpoint correcto con https
      const apiUrl = `${API_BASE_URL}/api/tiendas/${storeId}/empleados/`
      console.log("Intentando acceder a:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Respuesta del servidor:", response.status, response.statusText)

      if (response.ok) {
        const responseData = await response.json()
        console.log("Empleados obtenidos de la API:", responseData)

        // Extraer los empleados de la respuesta
        const empleadosData = responseData.empleados || []

        // Transformar los datos para que coincidan con nuestra interfaz
        const formattedEmployees = empleadosData.map((emp: any) => ({
          id: emp.id,
          nombre: emp.nombre,
          activo: true,
        }))

        setEmployees(formattedEmployees)
        setFilteredEmployees(formattedEmployees)

        // Guardar en localStorage para uso futuro
        localStorage.setItem(`store_${storeId}_employees`, JSON.stringify(formattedEmployees))
      } else if (response.status === 403) {
        console.log("Error 403: Acceso denegado. Verificando token...")

        // Intentar refrescar el token
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh: refreshToken,
              }),
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.access) {
                localStorage.setItem("backendToken", refreshData.access)
                console.log("Token refrescado exitosamente, reintentando...")

                // Reintentar con el nuevo token
                await fetchEmployees()
                return
              }
            }
          } catch (refreshError) {
            console.error("Error al refrescar token:", refreshError)
          }
        }

        throw new Error(`Error 403: No tienes permisos para acceder a los empleados de esta tienda`)
      } else {
        console.log(`Error al obtener empleados: ${response.status} ${response.statusText}`)
        throw new Error(`Error al obtener empleados: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error("Error al cargar los empleados:", err)
      setError(`No se pudieron cargar los empleados: ${err instanceof Error ? err.message : "Error desconocido"}`)

      // Intentar cargar desde localStorage como fallback
      const storedEmployees = localStorage.getItem(`store_${storeId}_employees`)
      if (storedEmployees) {
        const parsedEmployees = JSON.parse(storedEmployees)
        setEmployees(parsedEmployees)
        setFilteredEmployees(parsedEmployees.filter((emp: Employee) => emp.activo !== false))
      } else {
        // Si no hay datos en localStorage, generar datos de ejemplo
        const sampleEmployees = generateSampleEmployees()
        setEmployees(sampleEmployees)
        setFilteredEmployees(sampleEmployees)
        // Guardar en localStorage para futuras visitas
        localStorage.setItem(`store_${storeId}_employees`, JSON.stringify(sampleEmployees))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar empleados según búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEmployees(employees.filter((emp) => emp.activo !== false))
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = employees.filter(
        (employee) =>
          employee.activo !== false &&
          (employee.nombre.toLowerCase().includes(query) ||
            (employee.email && employee.email.toLowerCase().includes(query)) ||
            (employee.telefono && employee.telefono.includes(query)) ||
            (employee.cargo && employee.cargo.toLowerCase().includes(query))),
      )
      setFilteredEmployees(filtered)
    }
  }, [employees, searchQuery])

  // Modificar la función handleAddEmployee para enviar el formato correcto
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmployeeName.trim()) {
      setError("El nombre del empleado es obligatorio")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Obtener token directamente
      const token = localStorage.getItem("backendToken")
      if (!token) {
        throw new Error("No hay token de autenticación disponible")
      }

      // Usar exactamente el formato que espera el servidor
      const employeeData = {
        nombre: newEmployeeName,
        telefono: "",
        direccion: "",
      }

      console.log("Datos del empleado a añadir:", employeeData)

      // Usar el endpoint correcto con https
      const response = await fetch(
        `${API_BASE_URL}/api/tiendas/${storeId}/agregar_empleado/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(employeeData),
        },
      )

      // Intentar obtener más información sobre el error
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error del servidor:", errorText)
        throw new Error(`Error al añadir empleado: ${response.status} ${response.statusText}. Detalles: ${errorText}`)
      }

      const data = await response.json()
      console.log("Empleado añadido exitosamente:", data)

      // Actualizar la lista de empleados
      await fetchEmployees()

      // Limpiar formulario y cerrar diálogo
      setNewEmployeeName("")
      setNewEmployeeEmail("")
      setNewEmployeePhone("")
      setIsAddDialogOpen(false)

      // Mostrar mensaje de éxito
      toast({
        title: "Vendedor añadido",
        description: "El vendedor ha sido añadido con éxito",
        variant: "success",
      })
    } catch (err) {
      console.error("Error al añadir el empleado:", err)
      setError(`No se pudo añadir el empleado: ${err instanceof Error ? err.message : "Error desconocido"}`)

      // Añadir localmente como fallback
      try {
        // Obtener empleados actuales
        const currentEmployees = [...employees]

        // Generar un nuevo ID (el más alto + 1)
        const newId = currentEmployees.length > 0 ? Math.max(...currentEmployees.map((emp) => emp.id)) + 1 : 1

        // Crear el nuevo empleado
        const newEmployee: Employee = {
          id: newId,
          nombre: newEmployeeName,
          activo: true,
        }

        // Añadir el nuevo empleado a la lista
        const updatedEmployees = [...currentEmployees, newEmployee]

        // Actualizar estado
        setEmployees(updatedEmployees)
        setFilteredEmployees(updatedEmployees.filter((emp) => emp.activo !== false))

        // Guardar en localStorage
        localStorage.setItem(`store_${storeId}_employees`, JSON.stringify(updatedEmployees))

        // Limpiar formulario y cerrar diálogo
        setNewEmployeeName("")
        setNewEmployeeEmail("")
        setNewEmployeePhone("")
        setIsAddDialogOpen(false)

        // Mostrar mensaje de éxito
        toast({
          title: "Vendedor añadido localmente",
          description: "El vendedor ha sido añadido con éxito (modo local)",
          variant: "success",
        })
      } catch (localError) {
        console.error("Error al añadir localmente:", localError)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Corregir la función handleRemoveEmployee para usar el endpoint correcto
  const handleRemoveEmployee = async (employeeId: number, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar al vendedor ${nombre} de esta tienda?`)) {
      try {
        setIsLoading(true)

        // Obtener token directamente
        const token = localStorage.getItem("backendToken")
        if (!token) {
          throw new Error("No hay token de autenticación disponible")
        }

        // Usar el endpoint correcto con https y enviar el ID del empleado en el cuerpo
        const response = await fetch(
          `${API_BASE_URL}/api/tiendas/${storeId}/remover_empleado/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ empleado_id: employeeId }),
          },
        )

        if (response.ok) {
          console.log("Empleado eliminado exitosamente de la API")

          // Actualizar la lista de empleados
          await fetchEmployees()

          toast({
            title: "Vendedor eliminado",
            description: "El vendedor ha sido eliminado con éxito",
            variant: "success",
          })
        } else {
          console.log(`Error al eliminar empleado: ${response.status} ${response.statusText}`)
          throw new Error(`Error al eliminar empleado: ${response.status} ${response.statusText}`)
        }
      } catch (err) {
        console.error("Error al eliminar el empleado:", err)

        // Eliminar localmente como fallback
        try {
          // Marcar como inactivo en lugar de eliminar completamente
          const updatedEmployees = employees.map((emp) => (emp.id === employeeId ? { ...emp, activo: false } : emp))

          // Actualizar estado
          setEmployees(updatedEmployees)
          setFilteredEmployees(updatedEmployees.filter((emp) => emp.activo !== false))

          // Guardar en localStorage
          localStorage.setItem(`store_${storeId}_employees`, JSON.stringify(updatedEmployees))

          toast({
            title: "Vendedor eliminado localmente",
            description: "El vendedor ha sido eliminado con éxito (modo local)",
            variant: "default",
          })
        } catch (localError) {
          console.error("Error al eliminar localmente:", localError)
          toast({
            title: "Error",
            description: "No se pudo eliminar el vendedor",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top has-bottom-nav">
      <div className="bg-primary text-white p-5">
        <div className="flex items-center mb-2">
          <Link href="/home" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Vendedores de {storeName}</h1>
        </div>
        <p className="text-sm opacity-80 mt-1">Gestiona los vendedores de esta tienda</p>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
            <Input
              placeholder="Buscar vendedores..."
              className="pl-10 bg-input-bg border-0 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full h-12 bg-primary hover:bg-primary-dark flex items-center justify-center"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Añadir Vendedor
        </Button>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-text-secondary">Cargando vendedores...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchEmployees} className="bg-primary hover:bg-primary-dark">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-text-secondary mb-2">No hay vendedores registrados</p>
              <p className="text-sm text-text-secondary">Comienza añadiendo vendedores a esta tienda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{employee.nombre}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleRemoveEmployee(employee.id, employee.nombre)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo para añadir empleado */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Vendedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmployee}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="employeeName">Nombre del Vendedor</Label>
                <Input
                  id="employeeName"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Nombre completo"
                  className="bg-input-bg border-0"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setNewEmployeeName("")
                  setError(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary-dark" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Añadiendo...
                  </>
                ) : (
                  "Añadir"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </main>
  )
}
