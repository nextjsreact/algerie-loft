"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Zap,
  Shield,
  Brain,
  Cpu,
  Wifi,
  Activity,
  TrendingUp,
  Users,
  Settings,
  Eye,
  Sparkles
} from "lucide-react"

export default function FuturisticDemoPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeCard, setActiveCard] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => setProgress(75), 1000)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: Brain,
      title: "AI Intelligence",
      description: "Advanced neural networks processing",
      status: "Active",
      progress: 95
    },
    {
      icon: Shield,
      title: "Quantum Security",
      description: "Military-grade encryption protocols",
      status: "Protected",
      progress: 100
    },
    {
      icon: Zap,
      title: "Neural Speed",
      description: "Ultra-fast processing capabilities",
      status: "Optimized",
      progress: 88
    },
    {
      icon: Wifi,
      title: "Global Sync",
      description: "Real-time data synchronization",
      status: "Connected",
      progress: 92
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header */}
        <header className="p-6 border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-8 h-8 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  AI Control Center
                </h1>
                <p className="text-sm text-slate-400">Neural Network Operations Hub</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                <Activity className="w-3 h-3 mr-1" />
                System Online
              </Badge>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          {/* Hero Section with AI Face */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              {/* AI Face Visualization */}
              <div className="w-48 h-48 mx-auto relative">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin" style={{animationDuration: '8s'}}></div>

                {/* Face Circle */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-400/20 flex items-center justify-center">
                  {/* AI Face Representation */}
                  <div className="relative w-32 h-32">
                    {/* Eyes */}
                    <div className="absolute top-8 left-6 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div className="absolute top-8 right-6 w-3 h-3 bg-cyan-400 rounded-full animate-pulse delay-300"></div>

                    {/* Neural Pattern */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 border border-cyan-400/40 rounded-full flex items-center justify-center">
                        <Brain className="w-8 h-8 text-cyan-400" />
                      </div>
                    </div>

                    {/* Data Streams */}
                    <div className="absolute top-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-3 right-3 w-1 h-1 bg-indigo-400 rounded-full animate-ping delay-500"></div>
                    <div className="absolute top-1/2 left-1 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-1000"></div>
                  </div>
                </div>

                {/* Rotating Particles */}
                <div className="absolute inset-0">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                      style={{
                        top: '50%',
                        left: '50%',
                        transformOrigin: '0 0',
                        transform: `rotate(${i * 60}deg) translateY(-80px)`,
                        animationDelay: `${i * 200}ms`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              Advanced AI Operations Platform
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Experience the future of intelligent automation with our cutting-edge neural network infrastructure,
              designed for seamless integration and optimal performance.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300">
                <Sparkles className="w-4 h-4 mr-2" />
                Initialize AI Core
              </Button>
              <Button variant="outline" className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 px-8 py-3 rounded-full font-semibold backdrop-blur-sm">
                <Eye className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>

            {/* System Status */}
            <div className="inline-flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-400/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">All Systems Operational</span>
              <Badge variant="outline" className="border-green-400/50 text-green-400 text-xs">
                99.9% Uptime
              </Badge>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`bg-slate-800/40 backdrop-blur-sm border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group ${
                  activeCard === index ? 'ring-2 ring-cyan-400/50 bg-slate-800/60' : ''
                }`}
                onClick={() => setActiveCard(activeCard === index ? null : index)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <feature.icon className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        feature.status === 'Active' ? 'border-green-400/50 text-green-400' :
                        feature.status === 'Protected' ? 'border-blue-400/50 text-blue-400' :
                        feature.status === 'Optimized' ? 'border-yellow-400/50 text-yellow-400' :
                        'border-cyan-400/50 text-cyan-400'
                      }`}
                    >
                      {feature.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-white group-hover:text-cyan-300 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Performance</span>
                      <span className="text-cyan-400 font-mono">{feature.progress}%</span>
                    </div>
                    <Progress value={feature.progress} className="h-2 bg-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${feature.progress}%` }}
                      ></div>
                    </Progress>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Interactive Control Panel */}
          <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Neural Control Interface
              </CardTitle>
              <CardDescription className="text-slate-400">
                Interactive controls for AI system management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Processing Power */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Processing Power
                  </Label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">CPU Usage</span>
                      <span className="text-green-400 font-mono">45%</span>
                    </div>
                    <Progress value={45} className="h-2 bg-slate-700">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                    </Progress>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">GPU Load</span>
                      <span className="text-blue-400 font-mono">72%</span>
                    </div>
                    <Progress value={72} className="h-2 bg-slate-700">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                    </Progress>
                  </div>
                </div>

                {/* Network Status */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    Network Status
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Primary Node</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-mono">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Backup Node</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                        <span className="text-blue-400 text-sm font-mono">Standby</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Data Transfer</span>
                      <span className="text-cyan-400 text-sm font-mono">2.4 GB/s</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="space-y-3">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    System Health
                  </Label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Memory</span>
                      <span className="text-purple-400 font-mono">64/128 GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Temperature</span>
                      <span className="text-emerald-400 font-mono">42°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Uptime</span>
                      <span className="text-cyan-400 font-mono">15d 8h 32m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-700/50">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                  <Activity className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
                <Button variant="outline" className="border-red-400/50 text-red-400 hover:bg-red-400/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Emergency Stop
                </Button>
                <Button variant="outline" className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Add custom CSS for additional animations
const customStyles = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }
  50% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.5); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
`

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = customStyles
  document.head.appendChild(styleSheet)
}