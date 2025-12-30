'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Camera, 
  Phone, 
  Wifi, 
  Heart, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Key
} from 'lucide-react';

interface SafetyMeasuresProps {
  locale: string;
}

export default function SafetyMeasures({ locale }: SafetyMeasuresProps) {
  const content = {
    fr: {
      title: 'Sécurité et Protocoles',
      subtitle: 'Votre sécurité est notre priorité absolue',
      measures: {
        security: {
          title: 'Sécurité Physique',
          items: [
            'Serrures électroniques sécurisées',
            'Système de surveillance 24h/24',
            'Éclairage de sécurité automatique',
            'Accès contrôlé aux bâtiments'
          ]
        },
        safety: {
          title: 'Sécurité Incendie',
          items: [
            'Détecteurs de fumée certifiés',
            'Extincteurs dans chaque loft',
            'Issues de secours balisées',
            'Système d\'alarme connecté'
          ]
        },
        health: {
          title: 'Santé et Hygiène',
          items: [
            'Nettoyage professionnel certifié',
            'Désinfection entre chaque séjour',
            'Produits d\'hygiène de qualité',
            'Contrôle qualité de l\'air'
          ]
        },
        support: {
          title: 'Support d\'Urgence',
          items: [
            'Assistance 24h/24 et 7j/7',
            'Numéro d\'urgence dédié',
            'Intervention rapide sur site',
            'Partenariats services d\'urgence'
          ]
        }
      },
      virtualTour: 'Visite Virtuelle Disponible',
      viewTour: 'Voir la visite',
      emergencyContact: 'Contact d\'Urgence',
      safetyGuarantee: 'Garantie Sécurité 100%'
    },
    en: {
      title: 'Safety & Protocols',
      subtitle: 'Your safety is our absolute priority',
      measures: {
        security: {
          title: 'Physical Security',
          items: [
            'Secure electronic locks',
            '24/7 surveillance system',
            'Automatic security lighting',
            'Controlled building access'
          ]
        },
        safety: {
          title: 'Fire Safety',
          items: [
            'Certified smoke detectors',
            'Fire extinguishers in each loft',
            'Marked emergency exits',
            'Connected alarm system'
          ]
        },
        health: {
          title: 'Health & Hygiene',
          items: [
            'Certified professional cleaning',
            'Disinfection between stays',
            'Quality hygiene products',
            'Air quality control'
          ]
        },
        support: {
          title: 'Emergency Support',
          items: [
            '24/7 assistance',
            'Dedicated emergency number',
            'Rapid on-site intervention',
            'Emergency services partnerships'
          ]
        }
      },
      virtualTour: 'Virtual Tour Available',
      viewTour: 'View tour',
      emergencyContact: 'Emergency Contact',
      safetyGuarantee: '100% Safety Guarantee'
    },
    ar: {
      title: 'السلامة والبروتوكولات',
      subtitle: 'سلامتكم هي أولويتنا المطلقة',
      measures: {
        security: {
          title: 'الأمن المادي',
          items: [
            'أقفال إلكترونية آمنة',
            'نظام مراقبة 24/7',
            'إضاءة أمنية تلقائية',
            'دخول محكوم للمباني'
          ]
        },
        safety: {
          title: 'السلامة من الحرائق',
          items: [
            'أجهزة كشف الدخان المعتمدة',
            'طفايات حريق في كل لوفت',
            'مخارج طوارئ محددة',
            'نظام إنذار متصل'
          ]
        },
        health: {
          title: 'الصحة والنظافة',
          items: [
            'تنظيف مهني معتمد',
            'تطهير بين كل إقامة',
            'منتجات نظافة عالية الجودة',
            'مراقبة جودة الهواء'
          ]
        },
        support: {
          title: 'دعم الطوارئ',
          items: [
            'مساعدة 24/7',
            'رقم طوارئ مخصص',
            'تدخل سريع في الموقع',
            'شراكات خدمات الطوارئ'
          ]
        }
      },
      virtualTour: 'جولة افتراضية متاحة',
      viewTour: 'عرض الجولة',
      emergencyContact: 'اتصال الطوارئ',
      safetyGuarantee: 'ضمان السلامة 100%'
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const safetyCategories = [
    {
      key: 'security',
      icon: <Lock className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      key: 'safety',
      icon: <Shield className="w-6 h-6" />,
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      key: 'health',
      icon: <Heart className="w-6 h-6" />,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      key: 'support',
      icon: <Phone className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {text.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {text.subtitle}
        </p>
      </div>

      {/* Safety Measures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safetyCategories.map((category, index) => (
          <motion.div
            key={category.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            {/* Category Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                <div className={category.textColor}>
                  {category.icon}
                </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                {text.measures[category.key as keyof typeof text.measures].title}
              </h4>
            </div>

            {/* Safety Items */}
            <ul className="space-y-3">
              {text.measures[category.key as keyof typeof text.measures].items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Virtual Tour Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800"
      >
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {text.virtualTour}
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Explorez nos lofts et leurs équipements de sécurité en détail
              </p>
            </div>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>{text.viewTour}</span>
          </button>
        </div>
      </motion.div>

      {/* Emergency Contact & Guarantee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {text.emergencyContact}
            </h4>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            En cas d'urgence, contactez-nous immédiatement
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              +213 XXX XXX XXX
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Disponible 24h/24 et 7j/7
            </div>
          </div>
        </motion.div>

        {/* Safety Guarantee */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {text.safetyGuarantee}
            </h4>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            Nous garantissons le respect de tous nos protocoles de sécurité
          </p>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Certification ISO 45001
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}