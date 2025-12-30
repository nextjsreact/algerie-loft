/**
 * Configuration centralisée des informations de contact
 * 
 * Ce fichier contient toutes les informations de contact de l'entreprise.
 * Modifiez ici pour mettre à jour partout dans l'application.
 */

export const CONTACT_INFO = {
  // Téléphone
  phone: {
    display: "+213 56 03 62 543",
    link: "tel:+213560362543",
    whatsapp: "https://wa.me/213560362543"
  },
  
  // Email
  email: {
    display: "contact@loftalgerie.com",
    link: "mailto:contact@loftalgerie.com"
  },
  
  // Adresse
  address: {
    fr: "Alger, Algérie",
    en: "Algiers, Algeria",
    ar: "الجزائر العاصمة، الجزائر"
  },
  
  // Horaires
  hours: {
    fr: "Tous les jours: 9h00 - 22h00",
    en: "Every day: 9:00 AM - 10:00 PM",
    ar: "كل يوم: 9:00 ص - 10:00 م"
  },
  
  // Réseaux sociaux (à compléter si nécessaire)
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: ""
  }
} as const;

/**
 * Messages d'accroche pour la page de contact
 */
export const CONTACT_MESSAGES = {
  fr: {
    title: "Contactez-nous",
    subtitle: "Une question ? Un projet ? Propriétaires ou locataires, nous sommes là pour vous accompagner !",
    cta: "Envoyez-nous un message"
  },
  en: {
    title: "Contact Us",
    subtitle: "A question? A project? Owners or tenants, we are here to support you!",
    cta: "Send us a message"
  },
  ar: {
    title: "اتصل بنا",
    subtitle: "سؤال؟ مشروع؟ ملاك أو مستأجرون، نحن هنا لمساعدتك!",
    cta: "أرسل لنا رسالة"
  }
} as const;