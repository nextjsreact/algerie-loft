"use client"

import { TransactionForm } from "@/components/forms/transaction-form"
import { NewTransactionForm } from "@/components/forms/new-transaction-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap } from "lucide-react"

// Mock data for demo
const mockCategories = [
  { id: "1", name: "Alimentation", type: "expense" },
  { id: "2", name: "Transport", type: "expense" },
  { id: "3", name: "Salaire", type: "income" },
  { id: "4", name: "Freelance", type: "income" },
]

const mockLofts = [
  { id: "1", name: "Loft Paris Centre" },
  { id: "2", name: "Loft Lyon Presqu'île" },
]

const mockCurrencies = [
  { id: "1", name: "Euro", symbol: "€", ratio: 1, is_default: true },
  { id: "2", name: "Dollar US", symbol: "$", ratio: 0.85, is_default: false },
]

const mockPaymentMethods = [
  { id: "1", name: "Carte bancaire" },
  { id: "2", name: "Virement" },
  { id: "3", name: "Espèces" },
]

export function TransactionFormDemo() {
  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Formulaires de Transaction Améliorés
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Design moderne, convivial et intuitif
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✨ Design moderne
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              🎨 Interface intuitive
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              📱 Responsive
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="full-form" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
            <TabsTrigger value="full-form" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Formulaire Complet
            </TabsTrigger>
            <TabsTrigger value="quick-form" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Formulaire Rapide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full-form">
            <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">
                  Formulaire de Transaction Complet
                </CardTitle>
                <p className="text-gray-600">
                  Interface complète avec toutes les options et validations
                </p>
              </CardHeader>
              <CardContent>
                <TransactionForm
                  categories={mockCategories}
                  lofts={mockLofts}
                  currencies={mockCurrencies}
                  paymentMethods={mockPaymentMethods}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quick-form">
            <Card className="border-0 shadow-xl bg-white/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">
                  Formulaire de Transaction Rapide
                </CardTitle>
                <p className="text-gray-600">
                  Interface simplifiée pour une saisie rapide
                </p>
              </CardHeader>
              <CardContent>
                <NewTransactionForm onSubmit={handleSubmit} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-green-800 mb-2">Design Moderne</h3>
              <p className="text-green-700">
                Interface élégante avec des dégradés et des animations fluides
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-blue-800 mb-2">UX Améliorée</h3>
              <p className="text-blue-700">
                Icônes contextuelles, validation en temps réel et feedback visuel
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-purple-800 mb-2">Responsive</h3>
              <p className="text-purple-700">
                Optimisé pour tous les appareils, mobile et desktop
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}