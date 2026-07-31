"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { getApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = getApiBaseUrl()

export function RegisterForm() {
  // Cambiar el estado inicial para usar password1 en lugar de password
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password1: "", // Cambiado de password a password1 para coincidir con lo que espera la API
    password2: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    email?: string
    password1?: string
    password2?: string
    general?: string
  }>({})
  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const router = useRouter()
  const registrationRole = "vendedor"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when field changes
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  // Actualizar las validaciones para usar password1
  const validateForm = () => {
    const newErrors: {
      username?: string
      email?: string
      password1?: string
      password2?: string
    } = {}
    let isValid = true

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio"
      isValid = false
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido"
      isValid = false
    }

    // Validate password
    if (!formData.password1) {
      newErrors.password1 = "La contraseña es obligatoria"
      isValid = false
    } else if (formData.password1.length < 8) {
      newErrors.password1 = "La contraseña debe tener al menos 8 caracteres"
      isValid = false
    } else if (!/\d/.test(formData.password1)) {
      newErrors.password1 = "La contraseña debe contener al menos un número"
      isValid = false
    } else if (formData.password1 === formData.username) {
      newErrors.password1 = "La contraseña no puede ser igual al nombre de usuario"
      isValid = false
    }

    // Validate password confirmation
    if (formData.password1 !== formData.password2) {
      newErrors.password2 = "Las contraseñas no coinciden"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Actualizar el manejo de errores para usar password1
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const payload = {
        ...formData,
        role: registrationRole,
      }

      console.log("Enviando datos de registro:", payload)

      const response = await fetch(`${API_BASE_URL}/api/auth/registration/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      console.log("Respuesta del servidor:", response.status, response.statusText)

      // Get the response text first to log it
      const responseText = await response.text()
      console.log("Respuesta completa:", responseText)

      // Try to parse as JSON if possible
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Error al parsear respuesta JSON:", e)
        throw new Error("Formato de respuesta inválido del servidor")
      }

      if (!response.ok) {
        // Handle API error responses
        console.error("Error de registro:", data)

        const errorMessages: {
          username?: string
          email?: string
          password1?: string
          password2?: string
          general?: string
        } = {}

        // Handle different error formats
        if (typeof data === "object" && data !== null) {
          // Handle field-specific errors
          if (data.username) errorMessages.username = Array.isArray(data.username) ? data.username[0] : data.username
          if (data.email) errorMessages.email = Array.isArray(data.email) ? data.email[0] : data.email
          if (data.password1)
            errorMessages.password1 = Array.isArray(data.password1) ? data.password1[0] : data.password1
          if (data.password2)
            errorMessages.password2 = Array.isArray(data.password2) ? data.password2[0] : data.password2
          if (data.non_field_errors)
            errorMessages.general = Array.isArray(data.non_field_errors)
              ? data.non_field_errors[0]
              : data.non_field_errors

          // If there's a detail field, use it as general error
          if (data.detail) errorMessages.general = data.detail
        } else {
          // If data is not an object, use a generic error
          errorMessages.general = "Error en el registro. Por favor, intente nuevamente."
        }

        setErrors(errorMessages)

        // If we have any specific error, show it, otherwise show a generic message
        const errorMessage =
          errorMessages.general ||
          errorMessages.username ||
          errorMessages.email ||
          errorMessages.password1 ||
          errorMessages.password2 ||
          "Error en el registro"

        throw new Error(errorMessage)
      }

      // Registration successful, show success message and redirect to login page
      alert("Registro exitoso. Por favor inicia sesión con tus credenciales.")
      router.push("/")
    } catch (error) {
      console.error("Error de registro:", error)
      if (!errors.general) {
        setErrors((prev) => ({
          ...prev,
          general: error instanceof Error ? error.message : "Error en el registro. Intente nuevamente.",
        }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Registrar vendedor</h1>
        <div className="w-6"></div> {/* Spacer to center the title */}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{errors.general}</span>
            </div>
          )}

          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
            <Input
              id="username"
              name="username"
              placeholder="Nombre de usuario"
              className="pl-10 bg-input-bg border-0 h-12 text-base"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Correo electrónico"
              className="pl-10 bg-input-bg border-0 h-12 text-base"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="bg-input-bg rounded-md px-4 py-3 text-sm text-text-secondary">
            Rol asignado: <span className="font-semibold">Vendedor</span>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
            <Input
              id="password1"
              name="password1"
              type={showPassword1 ? "text" : "password"}
              placeholder="Contraseña"
              className="pl-10 pr-10 bg-input-bg border-0 h-12 text-base"
              value={formData.password1}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              onClick={() => setShowPassword1(!showPassword1)}
            >
              {showPassword1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {errors.password1 && <p className="text-sm text-red-500 mt-1">{errors.password1}</p>}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
            <Input
              id="password2"
              name="password2"
              type={showPassword2 ? "text" : "password"}
              placeholder="Confirmar contraseña"
              className="pl-10 pr-10 bg-input-bg border-0 h-12 text-base"
              value={formData.password2}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              onClick={() => setShowPassword2(!showPassword2)}
            >
              {showPassword2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
            {errors.password2 && <p className="text-sm text-red-500 mt-1">{errors.password2}</p>}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-primary hover:bg-primary-dark text-white android-ripple mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Registrando vendedor..." : "Registrar vendedor"}
          </Button>
        </div>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-white">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/" className="font-medium underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterForm

