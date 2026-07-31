"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Lock, LogIn, Store, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = getApiBaseUrl()

export function LoginForm() {
  // Estados para el formulario de administrador
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Estados para el formulario de vendedor
  const [vendorName, setVendorName] = useState("")
  const [vendorPassword, setVendorPassword] = useState("")
  const [showVendorPassword, setShowVendorPassword] = useState(false)

  // Estados generales
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginMode, setLoginMode] = useState<"select" | "admin" | "vendor">("select")

  const router = useRouter()

  // Función para determinar el turno actual (mañana o noche)
  const determinarTurnoActual = (): string => {
    const horaActual = new Date().getHours()
    // Si es entre 6am y 6pm, es turno de mañana, de lo contrario es turno de noche
    return horaActual >= 6 && horaActual < 18 ? "mañana" : "noche"
  }

  // Función para crear una caja para el vendedor
  const crearCajaParaVendedor = (usuarioId: number, nombreVendedor: string): void => {
    try {
      console.log(`Creando caja para el vendedor ${usuarioId}...`)
      const tiendaId = "3" // Siempre usamos la tienda 3

      // Get existing cash registers
      const storedCajas = localStorage.getItem(`store_${tiendaId}_cajas`)
      let cajas = []
      let nextId = 1

      if (storedCajas) {
        cajas = JSON.parse(storedCajas)
        // Find the highest ID to assign a new one
        if (cajas.length > 0) {
          nextId = Math.max(...cajas.map((caja: any) => caja.id)) + 1
        }
      }

      // Find the last closed cash register to use its final balance as initial balance
      let saldoInicial = "100000" // Default value
      if (cajas.length > 0) {
        // Sort cash registers by closing date (from most recent to oldest)
        const cajasCerradas = cajas
          .filter((caja: any) => caja.estado === "cerrada" && caja.saldo_final)
          .sort((a: any, b: any) => new Date(b.fecha_cierre).getTime() - new Date(a.fecha_cierre).getTime())

        if (cajasCerradas.length > 0) {
          saldoInicial = cajasCerradas[0].saldo_final
          console.log(`Usando saldo final de caja anterior: ${saldoInicial}`)
        }
      }

      // Determine current shift (morning or night)
      const turnoActual = determinarTurnoActual()

      // Create the new cash register
      const nuevaCaja = {
        id: nextId,
        usuario: usuarioId,
        usuario_nombre: nombreVendedor,
        turno: turnoActual,
        saldo_inicial: saldoInicial,
        saldo_final: saldoInicial, // Initially equal to initial balance
        estado: "abierta",
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: null,
      }

      console.log("Datos de la nueva caja:", nuevaCaja)

      // Add the new cash register to the list
      cajas.push(nuevaCaja)

      // Save to localStorage
      localStorage.setItem(`store_${tiendaId}_cajas`, JSON.stringify(cajas))

      // Save the cash register ID in localStorage for future reference
      localStorage.setItem("cajaActualId", nextId.toString())
      localStorage.setItem("cajaActualSaldoInicial", saldoInicial)

      console.log("Caja creada exitosamente")
    } catch (err) {
      console.error("Error al crear caja para el vendedor:", err)
    }
  }

  const normalizeRole = (roleValue: unknown): string => {
    if (typeof roleValue !== "string") {
      return ""
    }

    return roleValue
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  const isAdminRole = (roleValue: string): boolean => {
    return roleValue === "admin" || roleValue === "administrador"
  }

  const isVendorRole = (roleValue: string): boolean => {
    return roleValue === "vendor" || roleValue === "vendedor"
  }

  const fetchCurrentUser = async (accessToken: string) => {
    const meResponse = await fetch(`${API_BASE_URL}/api/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!meResponse.ok) {
      throw new Error(`No se pudo obtener el perfil autenticado (${meResponse.status})`)
    }

    return meResponse.json()
  }

  const resolveRoleFromResponses = (authData: any, meData: any): string => {
    const roleFromAuth = normalizeRole(authData?.user?.role || authData?.user?.rol || authData?.role || authData?.rol)
    if (roleFromAuth) {
      return roleFromAuth
    }

    return normalizeRole(meData?.role || meData?.rol)
  }

  const runLoginByMode = async (mode: "admin" | "vendor", identifier: string, plainPassword: string) => {
    const credentialField = identifier.includes("@") ? "email" : "username"

    const loginPayload: Record<string, string> = {
      password: plainPassword,
      [credentialField]: identifier,
    }

    const response = await fetch(`${API_BASE_URL}/api/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    })

    let authData: any = null
    try {
      authData = await response.json()
    } catch (parseError) {
      console.error("No se pudo parsear la respuesta de /api/token/:", parseError)
    }

    if (!response.ok) {
      const detail = authData?.detail || authData?.non_field_errors?.[0]
      throw new Error(detail || "Credenciales incorrectas")
    }

    const access = authData?.access
    const refresh = authData?.refresh

    if (!access || !refresh) {
      throw new Error("El login no devolvió access y refresh")
    }

    const meData = await fetchCurrentUser(access)
    const normalizedRole = resolveRoleFromResponses(authData, meData)

    if (mode === "admin" && !isAdminRole(normalizedRole)) {
      throw new Error("Tu cuenta no tiene rol de administrador")
    }

    if (mode === "vendor" && !isVendorRole(normalizedRole)) {
      throw new Error("Tu cuenta no tiene rol de vendedor")
    }

    localStorage.setItem("backendToken", access)
    localStorage.setItem("refreshToken", refresh)
    localStorage.setItem("tokenRole", normalizedRole)
    localStorage.setItem("userType", mode)

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    localStorage.setItem("tokenExpiresAt", expiresAt.toISOString())

    const displayName = meData?.nombre || meData?.name || meData?.username || identifier
    const userId = meData?.id

    if (mode === "vendor") {
      localStorage.setItem("vendorName", String(displayName))

      if (userId !== undefined && userId !== null) {
        localStorage.setItem("vendorId", String(userId))
      }

      const tiendaId = String(meData?.tienda_id || meData?.store_id || 3)
      const tiendaNombre = String(meData?.tienda_nombre || meData?.store_name || "Tienda Principal")

      localStorage.setItem("selectedStoreId", tiendaId)
      localStorage.setItem("selectedStoreName", tiendaNombre)

      const vendorNumericId = Number(userId)
      if (!Number.isNaN(vendorNumericId)) {
        crearCajaParaVendedor(vendorNumericId, String(displayName))
      }

      router.push("/home")
      return
    }

    router.push("/stores")
  }

  // Función actualizada para login de vendedor - con autenticación automática
  const handleVendorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validar que los campos no estén vacíos
    if (!vendorName.trim()) {
      setError("Por favor ingresa tu usuario o correo")
      setIsLoading(false)
      return
    }

    if (!vendorPassword.trim()) {
      setError("Por favor ingresa tu contraseña")
      setIsLoading(false)
      return
    }

    try {
      await runLoginByMode("vendor", vendorName.trim(), vendorPassword)
    } catch (error) {
      console.error("Error en login de vendedor:", error)
      setError(error instanceof Error ? error.message : "Error al verificar credenciales.")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para manejar el login de administrador
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validar que los campos no estén vacíos
    if (!username.trim() || !password.trim()) {
      setError("Por favor ingresa un usuario y contraseña")
      setIsLoading(false)
      return
    }

    try {
      await runLoginByMode("admin", username.trim(), password)
    } catch (error) {
      console.error("Error de inicio de sesión:", error)
      setError(error instanceof Error ? error.message : "Error al iniciar sesión. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-lg dark:shadow-large">
        <div className="bg-primary p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-sm text-white/80 mt-1">
            {loginMode === "select"
              ? "Selecciona tu tipo de usuario"
              : loginMode === "admin"
                ? "Inicia sesión como administrador"
                : "Inicia sesión como vendedor"}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loginMode === "select" ? (
            // Pantalla de selección de tipo de usuario
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-center mb-4">¿Cómo deseas iniciar sesión?</h2>

              <Button
                onClick={() => setLoginMode("admin")}
                className="w-full h-16 text-base bg-primary hover:bg-primary/90 text-white android-ripple btn-hover"
              >
                <User className="mr-3 h-6 w-6" />
                Soy Administrador
              </Button>

              <Button
                onClick={() => setLoginMode("vendor")}
                className="w-full h-16 text-base bg-primary hover:bg-primary/90 text-white android-ripple btn-hover"
              >
                <Store className="mr-3 h-6 w-6" />
                Soy Vendedor
              </Button>
            </div>
          ) : loginMode === "admin" ? (
            // Formulario de administrador
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="flex items-center mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("select")
                    setError("")
                  }}
                  className="flex items-center text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Volver</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                  <Input
                    id="username"
                    placeholder="Usuario o correo"
                    className="pl-10 bg-input-bg dark:bg-input border-0 h-12 text-base"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    className="pl-10 pr-10 bg-input-bg dark:bg-input border-0 h-12 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary dark:text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white android-ripple btn-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar como Administrador
                  </span>
                )}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("vendor")
                    setError("")
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Iniciar como vendedor
                </button>
              </div>
            </form>
          ) : (
            // Formulario de vendedor
            <form onSubmit={handleVendorLogin} className="space-y-4">
              <div className="flex items-center mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("select")
                    setError("")
                  }}
                  className="flex items-center text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>Volver</span>
                </button>
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                <Input
                  id="vendorName"
                  placeholder="Usuario o correo"
                  className="pl-10 bg-input-bg dark:bg-input border-0 h-12 text-base"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                <Input
                  id="vendorPassword"
                  type={showVendorPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="pl-10 pr-10 bg-input-bg dark:bg-input border-0 h-12 text-base"
                  value={vendorPassword}
                  onChange={(e) => setVendorPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary dark:text-muted-foreground"
                  onClick={() => setShowVendorPassword(!showVendorPassword)}
                >
                  {showVendorPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-white android-ripple btn-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Store className="mr-2 h-5 w-5" />
                    Entrar a mi tienda
                  </span>
                )}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("admin")
                    setError("")
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Iniciar como administrador
                </button>
              </div>

              <div className="text-sm text-center text-gray-500 dark:text-muted-foreground mt-2">
                Se valida tu rol en el backend antes de permitir el acceso
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-white dark:text-foreground">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="font-medium underline">
            Registra un vendedor
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
