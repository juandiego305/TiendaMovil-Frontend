"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Receipt } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Expense } from "../expenses/page"
import { useToast } from "@/hooks/use-toast"
import { fetchWithAuth } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://proyecto-tiendamovil.onrender.com"

export default function AddExpensePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  // Usar la fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState<Omit<Expense, "id">>({
    descripcion: "",
    amount: 0,
    date: today,
    categoria: "",
    paymentMethod: "",
    notes: "",
  })

  const [errors, setErrors] = useState({
    descripcion: "",
    amount: "",
    date: "",
    categoria: "",
    paymentMethod: "",
  })

  // Cargar el storeId del localStorage solo en el cliente
  useEffect(() => {
    // Este código solo se ejecuta en el cliente
    const storedStoreId = localStorage.getItem("selectedStoreId")
    setStoreId(storedStoreId)
  }, [])

  const resolveStoreId = () => {
    const activeStoreId = localStorage.getItem("selectedStoreId") || localStorage.getItem("activeStoreId")
    if (activeStoreId) return activeStoreId

    return storeId
  }

  const categories = ["Pedidos", "Servicios", "Nómina", "Alquiler", "Impuestos", "Otros"]

  const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta de Débito", "Tarjeta de Crédito", "Otro"]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
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

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      descripcion: "",
      amount: "",
      date: "",
      categoria: "",
      paymentMethod: "",
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria"
      isValid = false
    }

    if (formData.amount <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0"
      isValid = false
    }

    if (!formData.date) {
      newErrors.date = "La fecha es obligatoria"
      isValid = false
    }

    if (!formData.categoria) {
      newErrors.categoria = "Seleccione una categoría"
      isValid = false
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Seleccione un método de pago"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [category, setCategory] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")

  // Asegurar que la fecha se guarde correctamente al agregar un gasto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!description || !amount || !category || !paymentMethod || !date) {
        throw new Error("Por favor completa todos los campos requeridos")
      }

      const resolvedStoreId = resolveStoreId()
      if (!resolvedStoreId) {
        throw new Error("No hay una tienda activa o seleccionada")
      }

      const payload = {
        tienda_id: Number(resolvedStoreId),
        descripcion: description,
        monto: Number.parseFloat(amount),
        categoria: category,
      }

      const response = await fetchWithAuth(`${API_BASE_URL}/api/gastos/`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`No se pudo registrar el gasto: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const backendExpense = await response.json()

      const newExpense: Expense = {
        id: String(backendExpense.id ?? `expense-${Date.now()}`),
        descripcion: description,
        amount: Number.parseFloat(amount),
        date: date,
        categoria: category,
        paymentMethod: paymentMethod,
        notes: notes || "",
        storeId: resolvedStoreId,
      }

      const storedExpenses = localStorage.getItem("expenses")
      const expenses: Expense[] = storedExpenses ? JSON.parse(storedExpenses) : []
      expenses.push(newExpense)
      localStorage.setItem("expenses", JSON.stringify(expenses))

      // Mostrar mensaje de éxito
      toast({
        title: "Gasto registrado",
        description: "El gasto ha sido registrado correctamente",
        variant: "success",
      })

      // Redireccionar a la página de gastos
      router.push("/expenses")
    } catch (err) {
      console.error("Error al registrar el gasto:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href="/expenses" className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Registrar Gasto</h1>
      </div>

      <div className="container max-w-md mx-auto p-4">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="text-base">
              Descripción
            </Label>
            <Input
              id="descripcion"
              name="descripcion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pedido de frutas, Factura de luz"
              className="bg-input-bg border-0 h-12 text-base"
            />
            {errors.descripcion && <p className="text-sm text-red-500">{errors.descripcion}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base">
              Monto
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base">$</span>
              <Input
                id="amount"
                name="amount"
                value={amount || ""}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-input-bg border-0 pl-8 h-12 text-base"
                type="number"
                inputMode="decimal"
                min="0"
              />
            </div>
            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-base">
              Fecha
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input-bg border-0 h-12 text-base"
            />
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-base">
              Categoría
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value)}>
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

          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-base">
              Método de pago
            </Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
              <SelectTrigger className="bg-input-bg border-0 h-12 text-base">
                <SelectValue placeholder="Seleccionar método de pago" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}
          </div>

          <div className="bg-input-bg rounded-lg p-4 flex flex-col items-center justify-center h-40">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <p className="text-base text-text-secondary">Añadir comprobante</p>
            <p className="text-xs text-text-secondary mt-1">(Funcionalidad no disponible en esta versión)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base">
              Notas adicionales
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional sobre el gasto"
              className="bg-input-bg border-0 min-h-[100px] text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base bg-primary hover:bg-primary-dark mt-6 android-ripple"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Registrar Gasto"}
          </Button>
        </form>
      </div>
    </main>
  )
}
