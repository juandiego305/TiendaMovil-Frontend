"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import dynamic from 'next/dynamic';

// Importamos el componente dinámicamente y apagamos el SSR
const SimpleBarcodeScanner = dynamic(
  () => import('@/components/simple-barcode-scanner'),
  { ssr: false }
);

export default function BarcodeDebugPage() {
  const [showScanner, setShowScanner] = useState(false)

  return (
    <main className="flex min-h-screen flex-col bg-background-light android-safe-top">
      <div className="bg-white p-4 flex items-center">
        <Link href="/debug" className="mr-4">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">Depuración de Códigos de Barras</h1>
      </div>

      <div className="container max-w-md mx-auto p-4 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Prueba de Escáner</h2>
          <p className="text-sm text-gray-600 mb-4">
            Esta página te permite probar el escáner de códigos de barras de forma aislada. Cualquier código detectado
            se mostrará en la consola del navegador.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Para ver los resultados, abre la consola del navegador (F12 o Ctrl+Shift+I) antes de iniciar el escáner.
          </p>

          <div className="flex justify-center">
            <Button onClick={() => setShowScanner(true)} className="bg-primary hover:bg-primary-dark">
              Iniciar Escáner de Prueba
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-medium mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Haz clic en "Iniciar Escáner de Prueba"</li>
            <li>Apunta la cámara a cualquier código de barras</li>
            <li>Revisa la consola del navegador para ver los resultados</li>
            <li>Si se detecta un código, aparecerá una notificación</li>
          </ol>
        </div>
      </div>

      {showScanner && <SimpleBarcodeScanner onClose={() => setShowScanner(false)} />}
    </main>
  )
}
