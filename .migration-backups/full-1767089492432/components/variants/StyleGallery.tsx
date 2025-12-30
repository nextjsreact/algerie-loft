'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { HeaderLogo } from '@/components/futuristic/AnimatedLogo';
import { ExternalLink, Palette, Sparkles, Heart } from 'lucide-react';

export default function StyleGallery() {
  const variants = [
    {
      id: 1,
      title: "Style Futuriste",
      description: "Design moderne avec dégradés sombres, effets de verre et animations fluides. Parfait pour une image high-tech et innovante.",
      colors: ["#1e293b", "#3b82f6", "#8b5cf6"],
      features: ["Glassmorphism", "Animations avancées", "Particules flottantes", "Dégradés modernes"],
      link: "/fr/style-variant-1",
      mood: "Moderne & Innovant"
    },
    {
      id: 2,
      title: "Style Minimaliste",
      description: "Approche épurée avec beaucoup d'espace blanc, typographie élégante et mise en page structurée. Idéal pour un look professionnel.",
      colors: ["#ffffff", "#3b82f6", "#1f2937"],
      features: ["Design épuré", "Typographie soignée", "Espaces blancs", "Structure claire"],
      link: "/fr/style-variant-2",
      mood: "Élégant & Professionnel"
    },
    {
      id: 3,
      title: "Style Chaleureux",
      description: "Palette chaude avec des tons ambrés, design accueillant et émotionnel. Parfait pour créer une connexion humaine forte.",
      colors: ["#f59e0b", "#ea580c", "#dc2626"],
      features: ["Couleurs chaleureuses", "Design émotionnel", "Témoignages clients", "Approche humaine"],
      link: "/fr/style-variant-3",
      mood: "Humain & Authentique"
    },
    {
      id: 4,
      title: "Style Adaptatif",
      description: "Mode dark/light avec toggle interactif. Design moderne qui s'adapte aux préférences utilisateur avec animations fluides.",
      colors: ["#1e293b", "#3b82f6", "#ffffff"],
      features: ["Mode Dark/Light", "Toggle interactif", "Animations fluides", "Adaptatif"],
      link: "/fr/style-variant-4",
      mood: "Flexible & Moderne"
    },
    {
      id: 5,
      title: "Style Premium",
      description: "Design ultra-premium avec détection automatique du thème système. Typographie audacieuse et effets sophistiqués.",
      colors: ["#0f172a", "#10b981", "#ffffff"],
      features: ["Auto-détection thème", "Design premium", "Typographie bold", "Effets sophistiqués"],
      link: "/fr/style-variant-5",
      mood: "Luxueux & Sophistiqué"
    },
    {
      id: 6,
      title: "Style Cinématique",
      description: "Expérience immersive avec animations cinématiques, effets visuels avancés et interactions dynamiques.",
      colors: ["#000000", "#22d3ee", "#a855f7"],
      features: ["Animations cinématiques", "Effets visuels", "Interactions dynamiques", "Immersif"],
      link: "/fr/style-variant-6",
      mood: "Immersif & Spectaculaire"
    },
    {
      id: 7,
      title: "Confort Doré",
      description: "Luxe et chaleur avec des tons dorés, parfaitement aligné avec 'Votre Confort Notre Priorité'. Ambiance premium et accueillante.",
      colors: ["#f59e0b", "#d97706", "#fbbf24"],
      features: ["Mode Dark/Light", "Particules dorées", "Effets de confort", "Animations chaleureuses"],
      link: "/fr/style-variant-7",
      mood: "Luxueux & Chaleureux"
    },
    {
      id: 8,
      title: "Oasis Moderne",
      description: "Fraîcheur et sérénité avec des tons verts et bleus apaisants. Évoque une oasis de tranquillité et de bien-être.",
      colors: ["#10b981", "#059669", "#06b6d4"],
      features: ["Mode Dark/Light", "Bulles flottantes", "Effets aquatiques", "Animations zen"],
      link: "/fr/style-variant-8",
      mood: "Apaisant & Naturel"
    },
    {
      id: 9,
      title: "Élégance Urbaine",
      description: "Sophistication et modernité avec des tons neutres chics. Design minimaliste haut de gamme pour une clientèle exigeante.",
      colors: ["#64748b", "#475569", "#94a3b8"],
      features: ["Mode Dark/Light", "Géométrie moderne", "Typographie raffinée", "Animations subtiles"],
      link: "/fr/style-variant-9",
      mood: "Sophistiqué & Urbain"
    },
    {
      id: 10,
      title: "Chaleur Méditerranéenne",
      description: "Ambiance chaleureuse avec des tons terre et orange, capturant l'esprit méditerranéen et la douceur de vivre algérienne.",
      colors: ["#ea580c", "#dc2626", "#f97316"],
      features: ["Mode Dark/Light", "Rayons de soleil", "Particules chaudes", "Animations organiques"],
      link: "/fr/style-variant-10",
      mood: "Chaleureux & Authentique"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <HeaderLogo />
            <div className="flex items-center space-x-4">
              <Palette className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Galerie de Styles</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Choisissez Votre Style
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Découvrez nos différentes approches design pour Loft Algérie. 
              Chaque style reflète une personnalité unique tout en conservant l'excellence de votre marque.
            </p>
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">10 styles professionnels à explorer</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Galerie des Styles */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {variants.map((variant, index) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow group"
              >
                {/* Preview Colors */}
                <div className="h-32 flex">
                  {variant.colors.map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 transition-all group-hover:scale-105"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{variant.title}</h3>
                    {variant.id === 1 && <Sparkles className="w-6 h-6 text-blue-500" />}
                    {variant.id === 2 && <div className="w-6 h-6 border-2 border-gray-400 rounded" />}
                    {variant.id === 3 && <Heart className="w-6 h-6 text-orange-500" />}
                  </div>
                  
                  <div className="mb-4">
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {variant.mood}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {variant.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Caractéristiques :</h4>
                    <ul className="space-y-2">
                      {variant.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link href={variant.link}>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center group-hover:scale-105">
                      <span className="mr-2">Voir ce Style</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Comment Choisir ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Explorez</h3>
                <p className="text-gray-600 text-sm">Visitez chaque style pour voir les animations et interactions</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Comparez</h3>
                <p className="text-gray-600 text-sm">Notez celui qui correspond le mieux à votre vision</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Décidez</h3>
                <p className="text-gray-600 text-sm">Choisissez le style qui représente le mieux Loft Algérie</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <HeaderLogo />
          <p className="text-gray-400 mt-4">
            © 2024 Loft Algérie - Galerie de Styles Professionnels
          </p>
        </div>
      </footer>
    </div>
  );
}