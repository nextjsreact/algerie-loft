'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Home, 
  Users, 
  Calendar,
  DollarSign,
  Camera,
  Wifi,
  Car,
  Utensils,
  Tv,
  Wind,
  Waves,
  CheckCircle
} from 'lucide-react';

interface PropertyEvaluationFormProps {
  locale: string;
  onSubmit?: (data: PropertyEvaluationData) => void;
}

interface PropertyEvaluationData {
  // Property Details
  propertyType: string;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  
  // Owner Details
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Current Situation
  currentlyRented: boolean;
  currentRent?: number;
  availabilityDate: string;
  
  // Property Features
  amenities: string[];
  
  // Additional Info
  description: string;
  expectations: string;
}

/**
 * Property Evaluation Request Form
 * Implements requirements 4.4, 9.2, 9.4, 9.5
 */
export default function PropertyEvaluationForm({ locale, onSubmit }: PropertyEvaluationFormProps) {
  const [formData, setFormData] = useState<Partial<PropertyEvaluationData>>({
    amenities: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      title: "Évaluation gratuite de votre propriété",
      subtitle: "Obtenez une estimation personnalisée du potentiel de revenus de votre loft",
      propertyDetails: "Détails de la propriété",
      ownerDetails: "Vos informations",
      currentSituation: "Situation actuelle",
      propertyFeatures: "Équipements et services",
      additionalInfo: "Informations complémentaires",
      
      fields: {
        propertyType: "Type de propriété",
        location: "Ville",
        address: "Adresse complète",
        bedrooms: "Nombre de chambres",
        bathrooms: "Nombre de salles de bain",
        surface: "Surface (m²)",
        ownerName: "Nom complet",
        ownerEmail: "Email",
        ownerPhone: "Téléphone",
        currentlyRented: "Actuellement loué",
        currentRent: "Loyer actuel (DZD/mois)",
        availabilityDate: "Date de disponibilité",
        description: "Description de la propriété",
        expectations: "Vos attentes et objectifs"
      },
      
      propertyTypes: {
        apartment: "Appartement",
        loft: "Loft",
        studio: "Studio",
        duplex: "Duplex",
        villa: "Villa"
      },
      
      cities: {
        algiers: "Alger",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        tlemcen: "Tlemcen",
        setif: "Sétif",
        batna: "Batna",
        biskra: "Biskra"
      },
      
      amenities: {
        wifi: "WiFi haut débit",
        parking: "Parking",
        kitchen: "Cuisine équipée",
        tv: "TV/Netflix",
        ac: "Climatisation",
        balcony: "Balcon/Terrasse",
        elevator: "Ascenseur",
        security: "Sécurité 24h/24",
        pool: "Piscine",
        gym: "Salle de sport",
        laundry: "Lave-linge",
        dishwasher: "Lave-vaisselle"
      },
      
      placeholders: {
        address: "Ex: Rue Didouche Mourad, Alger Centre",
        description: "Décrivez votre propriété, ses points forts, l'environnement...",
        expectations: "Ex: Maximiser les revenus, gestion sans stress, améliorer l'occupancy..."
      },
      
      submitButton: "Demander mon évaluation gratuite",
      submitting: "Envoi en cours...",
      
      successMessage: {
        title: "Demande envoyée avec succès !",
        description: "Notre équipe va analyser votre propriété et vous contacter sous 24h avec une estimation détaillée.",
        nextSteps: "Prochaines étapes :",
        steps: [
          "Analyse de marché personnalisée",
          "Estimation du potentiel de revenus",
          "Proposition de stratégie de gestion",
          "Rendez-vous pour visite (si souhaité)"
        ]
      }
    },
    en: {
      title: "Free property evaluation",
      subtitle: "Get a personalized estimate of your loft's revenue potential",
      propertyDetails: "Property details",
      ownerDetails: "Your information",
      currentSituation: "Current situation",
      propertyFeatures: "Amenities and services",
      additionalInfo: "Additional information",
      
      fields: {
        propertyType: "Property type",
        location: "City",
        address: "Full address",
        bedrooms: "Number of bedrooms",
        bathrooms: "Number of bathrooms",
        surface: "Surface area (m²)",
        ownerName: "Full name",
        ownerEmail: "Email",
        ownerPhone: "Phone",
        currentlyRented: "Currently rented",
        currentRent: "Current rent (DZD/month)",
        availabilityDate: "Availability date",
        description: "Property description",
        expectations: "Your expectations and goals"
      },
      
      propertyTypes: {
        apartment: "Apartment",
        loft: "Loft",
        studio: "Studio",
        duplex: "Duplex",
        villa: "Villa"
      },
      
      cities: {
        algiers: "Algiers",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        tlemcen: "Tlemcen",
        setif: "Setif",
        batna: "Batna",
        biskra: "Biskra"
      },
      
      amenities: {
        wifi: "High-speed WiFi",
        parking: "Parking",
        kitchen: "Equipped kitchen",
        tv: "TV/Netflix",
        ac: "Air conditioning",
        balcony: "Balcony/Terrace",
        elevator: "Elevator",
        security: "24/7 Security",
        pool: "Swimming pool",
        gym: "Gym",
        laundry: "Washing machine",
        dishwasher: "Dishwasher"
      },
      
      placeholders: {
        address: "Ex: Didouche Mourad Street, Algiers Center",
        description: "Describe your property, its strengths, the environment...",
        expectations: "Ex: Maximize revenue, stress-free management, improve occupancy..."
      },
      
      submitButton: "Request my free evaluation",
      submitting: "Submitting...",
      
      successMessage: {
        title: "Request sent successfully!",
        description: "Our team will analyze your property and contact you within 24h with a detailed estimate.",
        nextSteps: "Next steps:",
        steps: [
          "Personalized market analysis",
          "Revenue potential estimation",
          "Management strategy proposal",
          "Visit appointment (if desired)"
        ]
      }
    },
    ar: {
      title: "تقييم مجاني لعقارك",
      subtitle: "احصل على تقدير شخصي لإمكانات إيرادات شقتك المفروشة",
      propertyDetails: "تفاصيل العقار",
      ownerDetails: "معلوماتك",
      currentSituation: "الوضع الحالي",
      propertyFeatures: "المرافق والخدمات",
      additionalInfo: "معلومات إضافية",
      
      fields: {
        propertyType: "نوع العقار",
        location: "المدينة",
        address: "العنوان الكامل",
        bedrooms: "عدد غرف النوم",
        bathrooms: "عدد الحمامات",
        surface: "المساحة (م²)",
        ownerName: "الاسم الكامل",
        ownerEmail: "البريد الإلكتروني",
        ownerPhone: "الهاتف",
        currentlyRented: "مؤجر حالياً",
        currentRent: "الإيجار الحالي (دج/شهر)",
        availabilityDate: "تاريخ التوفر",
        description: "وصف العقار",
        expectations: "توقعاتك وأهدافك"
      },
      
      propertyTypes: {
        apartment: "شقة",
        loft: "شقة مفروشة",
        studio: "استوديو",
        duplex: "دوبلكس",
        villa: "فيلا"
      },
      
      cities: {
        algiers: "الجزائر",
        oran: "وهران",
        constantine: "قسنطينة",
        annaba: "عنابة",
        tlemcen: "تلمسان",
        setif: "سطيف",
        batna: "باتنة",
        biskra: "بسكرة"
      },
      
      amenities: {
        wifi: "واي فاي عالي السرعة",
        parking: "موقف سيارات",
        kitchen: "مطبخ مجهز",
        tv: "تلفزيون/نتفليكس",
        ac: "تكييف",
        balcony: "شرفة/تراس",
        elevator: "مصعد",
        security: "أمن 24/24",
        pool: "مسبح",
        gym: "صالة رياضة",
        laundry: "غسالة",
        dishwasher: "غسالة أطباق"
      },
      
      placeholders: {
        address: "مثال: شارع ديدوش مراد، وسط الجزائر",
        description: "صف عقارك، نقاط قوته، البيئة المحيطة...",
        expectations: "مثال: تعظيم الإيرادات، إدارة بدون ضغط، تحسين الإشغال..."
      },
      
      submitButton: "اطلب تقييمي المجاني",
      submitting: "جاري الإرسال...",
      
      successMessage: {
        title: "تم إرسال الطلب بنجاح!",
        description: "سيقوم فريقنا بتحليل عقارك والاتصال بك خلال 24 ساعة مع تقدير مفصل.",
        nextSteps: "الخطوات التالية:",
        steps: [
          "تحليل السوق الشخصي",
          "تقدير إمكانات الإيرادات",
          "اقتراح استراتيجية الإدارة",
          "موعد للزيارة (إذا رغبت)"
        ]
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const amenityIcons = {
    wifi: Wifi,
    parking: Car,
    kitchen: Utensils,
    tv: Tv,
    ac: Wind,
    balcony: Waves,
    elevator: Home,
    security: CheckCircle,
    pool: Waves,
    gym: Users,
    laundry: Home,
    dishwasher: Utensils
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    if (onSubmit) {
      onSubmit(formData as PropertyEvaluationData);
    }
  };

  const handleAmenityChange = (amenityKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...(prev.amenities || []), amenityKey]
        : (prev.amenities || []).filter(a => a !== amenityKey)
    }));
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {text.successMessage.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {text.successMessage.description}
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                {text.successMessage.nextSteps}
              </h4>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                {text.successMessage.steps.map((step, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          {text.title}
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-300">
          {text.subtitle}
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Home className="h-5 w-5" />
              {text.propertyDetails}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="propertyType">{text.fields.propertyType}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, propertyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={text.fields.propertyType} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(text.propertyTypes).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location">{text.fields.location}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={text.fields.location} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(text.cities).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2 lg:col-span-1">
                <Label htmlFor="surface">{text.fields.surface}</Label>
                <Input
                  id="surface"
                  type="number"
                  placeholder="120"
                  onChange={(e) => setFormData(prev => ({ ...prev, surface: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="bedrooms">{text.fields.bedrooms}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, bedrooms: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="bathrooms">{text.fields.bathrooms}</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, bathrooms: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="1" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">{text.fields.address}</Label>
              <Input
                id="address"
                placeholder={text.placeholders.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Owner Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              {text.ownerDetails}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ownerName">{text.fields.ownerName}</Label>
                <Input
                  id="ownerName"
                  required
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="ownerEmail">{text.fields.ownerEmail}</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  required
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="ownerPhone">{text.fields.ownerPhone}</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  required
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Current Situation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {text.currentSituation}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="currentlyRented"
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, currentlyRented: !!checked }))}
                />
                <Label htmlFor="currentlyRented">{text.fields.currentlyRented}</Label>
              </div>
              
              <div>
                <Label htmlFor="currentRent">{text.fields.currentRent}</Label>
                <Input
                  id="currentRent"
                  type="number"
                  placeholder="50000"
                  disabled={!formData.currentlyRented}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentRent: parseInt(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label htmlFor="availabilityDate">{text.fields.availabilityDate}</Label>
                <Input
                  id="availabilityDate"
                  type="date"
                  onChange={(e) => setFormData(prev => ({ ...prev, availabilityDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {text.propertyFeatures}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(text.amenities).map(([key, label]) => {
                const IconComponent = amenityIcons[key as keyof typeof amenityIcons];
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      onCheckedChange={(checked) => handleAmenityChange(key, !!checked)}
                    />
                    <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                      <IconComponent className="h-4 w-4" />
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {text.additionalInfo}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">{text.fields.description}</Label>
                <Textarea
                  id="description"
                  placeholder={text.placeholders.description}
                  rows={3}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="expectations">{text.fields.expectations}</Label>
                <Textarea
                  id="expectations"
                  placeholder={text.placeholders.expectations}
                  rows={3}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectations: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? text.submitting : text.submitButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}