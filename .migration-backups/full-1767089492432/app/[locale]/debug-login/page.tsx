import { LoginDebug } from "@/components/debug/login-debug"
import { EnvDebug } from "@/components/debug/env-debug"
import { EnvChecker } from "@/components/debug/env-checker"

export default function DebugLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔍 Debug Login Page
        </h1>
        <EnvChecker />
        <EnvDebug />
        <LoginDebug />
      </div>
    </div>
  )
}