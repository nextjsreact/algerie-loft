"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { loginSchema, type LoginFormData } from "@/lib/validations"

export function ClientLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError("")

    try {
      console.log('🔐 Tentative de connexion CLIENT avec:', data.email)
      
      // Utiliser la fonction login avec le contexte CLIENT
      const { login } = await import('@/lib/auth')
      const result = await login(data.email, data.password, 'fr', 'client')

      if (!result.success) {
        console.error("Erreur connexion:", result.error)
        setError(result.error || "Échec de la connexion")
        setIsLoading(false)
        return
      }

      console.log('✅ Connexion CLIENT réussie:', data.email)
      
      // Créer le cookie de contexte côté client
      document.cookie = `login_context=client; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      console.log('✅ Cookie login_context=client créé')
      
      console.log('✅ Redirection vers client dashboard...')
      
      // TOUJOURS rediriger vers le dashboard client
      // Car l'utilisateur s'est connecté via le formulaire CLIENT
      router.push("/fr/client/dashboard")
      // Ne pas appeler setIsLoading(false) ici car on redirige
      
    } catch (err: any) {
      console.error("Erreur inattendue:", err)
      setError(err.message || "Une erreur inattendue s'est produite")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">🔐 Connexion DEV</h1>
        <p className="text-muted-foreground">Connectez-vous à l'environnement de développement</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@dev.local"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="dev123"
              {...register("password")}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        <p className="font-medium mb-2">Identifiants DEV :</p>
        <p>📧 admin@dev.local</p>
        <p>🔑 dev123</p>
      </div>

      <div className="text-center">
        <Link href="/register" className="text-blue-600 hover:underline">
          Créer un nouveau compte
        </Link>
      </div>
    </div>
  )
}