import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-primary via-primary-light to-accent-pink dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 android-safe-top">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Logo en la parte superior */}
      <div className="text-center pt-16 pb-8">
        <div className="tienda-title text-white text-4xl drop-shadow-lg">
          <div>Tienda</div>
          <div>mixta</div>
          <div>doña jose</div>
        </div>
        <div className="text-white/80 text-sm mt-2">by Juancho</div>
      </div>

      {/* Formulario centrado */}
      <div className="flex-1 flex items-center justify-center p-6">
        <LoginForm />
      </div>
    </main>
  )
}
