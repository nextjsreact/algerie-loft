'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Star,
  ChevronDown,
  Search,
  Calendar,
  Heart,
  Quote,
  TrendingUp,
  Building2,
  Zap,
  Award,
  Users,
  Globe,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV5Props {
  locale: string;
}

type Loft = {
  id: string;
  name: string;
  address?: string;
  description?: string;
  price_per_night?: number;
  zone?: string;
  photo?: string;
};

const WHATSAPP_URL = 'https://wa.me/213560362543';
const PHONE_DISPLAY = '+213 56 03 62 543';
const PHONE_LINK = 'tel:+213560362543';
const EMAIL = 'contact@loftalgerie.com';

const fallbackLofts: Loft[] = [
  {
    id: 'fallback-1',
    name: 'Candy Loft',
    zone: 'Alger Centre',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c4931c00-1792-492d-9101-4bc583484749/e43a66e0-1929-4bd1-8df8-ddf676cf70f8.jpeg',
  },
  {
    id: 'fallback-2',
    name: 'Swan Loft',
    zone: 'El Mouradia, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/b305b744-5ae6-40ed-bf91-00a848a4b1bc/e4defb1a-3b52-4128-b6d5-f3155766b913.jpeg',
  },
  {
    id: 'fallback-3',
    name: 'Dary Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/bcbf0c9f-a179-49e3-be64-f61339de4c8c/f0ec4489-a4fb-4a0a-9113-8ff8bdf6f643.jpg',
  },
  {
    id: 'fallback-4',
    name: 'Choco Loft',
    zone: 'Alger Centre',
    price_per_night: 10000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/0d79d0fd-41e5-4206-97d1-cb217279c7e8/ea5bfb99-18a6-47f5-8534-4b74a14cb896.jpg',
  },
  {
    id: 'fallback-5',
    name: 'Dounia Loft',
    zone: 'Hussein Dey, Alger',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/9be87001-9977-4f1b-8bf5-e183f9ee8d27/c5ebd720-8dc8-42d6-b6b1-88de54a6f4e4.jpg',
  },
  {
    id: 'fallback-6',
    name: 'Talia Loft',
    zone: 'Alger Centre',
    price_per_night: 9000,
    photo:
      'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c8f109bc-86c2-4aa5-a472-d155b3085c15/6ba33f2e-2fb0-4503-991a-857916aca347.jpg',
  },
];

const copy = {
  fr: {
    heroEyebrow: 'Lofts d\u2019exception \u2014 Alger \u00b7 Oran \u00b7 Constantine',
    heroTitle: 'L\u2019avenir de l\u2019hospitalit\u00e9 alg\u00e9rienne',
    heroSubtitle:
      'Une collection cur\u00e9e de lofts haut de gamme. R\u00e9servation intelligente, arriv\u00e9e sans contact, exp\u00e9rience immersive.',
    heroCtaPrimary: 'Explorer les lofts',
    heroCtaSecondary: 'Contacter via WhatsApp',
    scroll: 'D\u00e9couvrir',
    statsGuests: 'Voyageurs accueillis',
    statsLofts: 'Lofts d\u2019exception',
    statsCities: 'Villes',
    statsRating: 'Note moyenne',
    collectionEyebrow: 'La collection',
    collectionTitle: 'Des espaces qui red\u00e9finissent le s\u00e9jour',
    collectionSubtitle:
      'Chaque loft est inspect\u00e9, photographi\u00e9 et entretenu avec le m\u00eame niveau d\u2019exigence.',
    perNight: '/ nuit',
    view: 'Voir le loft',
    viewAll: 'Voir tous les lofts',
    promiseEyebrow: 'Notre promesse',
    promiseTitle: 'Le confort d\u2019un h\u00f4tel, l\u2019\u00e2me d\u2019un chez-soi',
    feat1Title: 'S\u00e9lection exigeante',
    feat1Desc:
      'Moins de lofts, mieux choisis. Nous ne r\u00e9f\u00e9ren\u00e7ons que des biens qui nous s\u00e9duisent vraiment.',
    feat2Title: 'Arriv\u00e9e sans friction',
    feat2Desc:
      'Check-in flexible, instructions claires, \u00e9quipe joignable \u00e0 toute heure pour un s\u00e9jour serein.',
    feat3Title: 'Confiance & s\u00e9curit\u00e9',
    feat3Desc:
      'Paiement s\u00e9curis\u00e9, lofts v\u00e9rifi\u00e9s, photos r\u00e9elles. Ce que vous voyez est ce que vous vivez.',
    testimonialsEyebrow: 'T\u00e9moignages',
    testimonialsTitle: 'Ils ont v\u00e9cu l\u2019exp\u00e9rience',
    testimonial1:
      'Un s\u00e9jour parfait du d\u00e9but \u00e0 la fin. Le loft \u00e9tait encore plus beau que sur les photos, et l\u2019accueil \u00e9tait chaleureux.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'Je voyage souvent pour le travail \u00e0 Alger. Loft Alg\u00e9rie est devenu mon adresse de confiance. Qualit\u00e9 constante, service impeccable.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Bruxelles, Belgique',
    testimonial3:
      'Nous avons lou\u00e9 le Candy Loft pour notre lune de miel. Magique. Le rooftop, la lumi\u00e8re, la d\u00e9coration... tout \u00e9tait parfait.',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    processEyebrow: 'Comment \u00e7a marche',
    processTitle: 'Votre s\u00e9jour en 3 \u00e9tapes',
    processStep1Title: 'Choisissez',
    processStep1Desc: 'Parcourez notre collection et trouvez le loft qui vous correspond.',
    processStep2Title: 'R\u00e9servez',
    processStep2Desc: 'R\u00e9servez en direct, sans interm\u00e9diaire. Paiement s\u00e9curis\u00e9.',
    processStep3Title: 'Profitez',
    processStep3Desc: 'Arriv\u00e9e fluide, accueil personnalis\u00e9. Votre s\u00e9jour commence.',
    faqEyebrow: 'Questions fr\u00e9quentes',
    faqTitle: 'Tout ce que vous devez savoir',
    faq1Q: 'Comment r\u00e9server un loft ?',
    faq1A: 'Parcourez notre collection, choisissez votre loft et r\u00e9servez directement en ligne. Vous pouvez aussi nous contacter par WhatsApp pour une r\u00e9servation personnalis\u00e9e.',
    faq2Q: 'Quels sont les modes de paiement accept\u00e9s ?',
    faq2A: 'Nous acceptons les paiements par carte bancaire, virement, et esp\u00e8ces \u00e0 l\u2019arriv\u00e9e selon les conditions du loft.',
    faq3Q: 'Puis-je annuler ma r\u00e9servation ?',
    faq3A: 'Oui, selon la politique d\u2019annulation de chaque loft. La plupart offrent une annulation gratuite jusqu\u2019\u00e0 48h avant l\u2019arriv\u00e9e.',
    faq4Q: 'Les lofts sont-ils v\u00e9rifi\u00e9s ?',
    faq4A: 'Absolument. Chaque loft est inspect\u00e9 par nos \u00e9quipes, photographi\u00e9 professionnellement et \u00e9valu\u00e9 r\u00e9guli\u00e8rement.',
    faq5Q: 'Proposez-vous des r\u00e9ductions pour les s\u00e9jours longs ?',
    faq5A: 'Oui, nous offrons des tarifs pr\u00e9f\u00e9rentiels pour les s\u00e9jours de 7 nuits et plus. Contactez-nous pour un devis personnalis\u00e9.',
    ownerEyebrow: 'Propri\u00e9taires',
    ownerTitle: 'Valorisez votre bien, sans les contraintes',
    ownerSubtitle:
      'Confiez-nous la gestion de votre loft et augmentez vos revenus locatifs jusqu\u2019\u00e0 40%, en toute s\u00e9r\u00e9nit\u00e9.',
    ownerB1: 'Gestion compl\u00e8te et transparente',
    ownerB2: 'Photographie et mise en valeur professionnelle',
    ownerB3: 'Service voyageurs disponible en continu',
    ownerB4: 'Revenus s\u00e9curis\u00e9s, sans frais cach\u00e9s',
    ownerCta: 'Estimer mes revenus',
    ownerCtaSecondary: 'Nous appeler',
    avgRevenue: 'Revenu mensuel moyen',
    revenueUp: 'Hausse moyenne des revenus',
    ctaTitle: 'Votre prochain s\u00e9jour commence ici',
    ctaSubtitle:
      'Dites-nous o\u00f9 et quand. Nous nous occupons du reste.',
    ctaPrimary: 'Explorer les lofts',
    ctaSecondary: 'WhatsApp',
    newsletterTitle: 'Restez inform\u00e9',
    newsletterSubtitle: 'Recevez nos meilleures adresses et offres exclusives.',
    newsletterPlaceholder: 'Votre adresse email',
    newsletterButton: 'S\u2019inscrire',
    newsletterPrivacy: 'Pas de spam. D\u00e9sinscription \u00e0 tout moment.',
    footerTagline: 'Locations de lofts haut de gamme en Alg\u00e9rie',
    footerExplore: 'Explorer',
    footerLofts: 'Nos lofts',
    footerOwners: 'Devenir partenaire',
    footerAbout: '\u00c0 propos',
    footerContact: 'Contact',
    footerClient: 'Espace client',
    rights: 'Tous droits r\u00e9serv\u00e9s',
  },
  en: {
    heroEyebrow: 'Exceptional lofts \u2014 Algiers \u00b7 Oran \u00b7 Constantine',
    heroTitle: 'The future of Algerian hospitality',
    heroSubtitle:
      'A curated collection of premium lofts. Smart booking, contactless arrival, immersive experience.',
    heroCtaPrimary: 'Explore lofts',
    heroCtaSecondary: 'Contact via WhatsApp',
    scroll: 'Discover',
    statsGuests: 'Guests welcomed',
    statsLofts: 'Exceptional lofts',
    statsCities: 'Cities',
    statsRating: 'Average rating',
    collectionEyebrow: 'The collection',
    collectionTitle: 'Spaces that redefine staying',
    collectionSubtitle:
      'Every loft is inspected, photographed and maintained to the same demanding standard.',
    perNight: '/ night',
    view: 'View loft',
    viewAll: 'View all lofts',
    promiseEyebrow: 'Our promise',
    promiseTitle: 'The comfort of a hotel, the soul of a home',
    feat1Title: 'Curated selection',
    feat1Desc:
      'Fewer lofts, better chosen. We only list places that genuinely win us over.',
    feat2Title: 'Frictionless arrival',
    feat2Desc:
      'Flexible check-in, clear instructions, a team reachable any time for a serene stay.',
    feat3Title: 'Trust & safety',
    feat3Desc:
      'Secure payment, verified lofts, real photos. What you see is what you live.',
    testimonialsEyebrow: 'Testimonials',
    testimonialsTitle: 'They lived the experience',
    testimonial1:
      'A perfect stay from start to finish. The loft was even more beautiful than in the photos, and the welcome was warm.',
    testimonial1Author: 'Sarah M.',
    testimonial1Role: 'Paris, France',
    testimonial2:
      'I often travel for work to Algiers. Loft Algeria has become my trusted address. Consistent quality, impeccable service.',
    testimonial2Author: 'Karim B.',
    testimonial2Role: 'Brussels, Belgium',
    testimonial3:
      'We rented the Candy Loft for our honeymoon. Magical. The rooftop, the light, the decor... everything was perfect.',
    testimonial3Author: 'Amine & Lina',
    testimonial3Role: 'Lyon, France',
    processEyebrow: 'How it works',
    processTitle: 'Your stay in 3 steps',
    processStep1Title: 'Choose',
    processStep1Desc: 'Browse our collection and find the loft that suits you.',
    processStep2Title: 'Book',
    processStep2Desc: 'Book directly, no middleman. Secure payment.',
    processStep3Title: 'Enjoy',
    processStep3Desc: 'Smooth arrival, personalized welcome. Your stay begins.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Everything you need to know',
    faq1Q: 'How do I book a loft?',
    faq1A: 'Browse our collection, choose your loft and book directly online. You can also contact us via WhatsApp for a personalized booking.',
    faq2Q: 'What payment methods are accepted?',
    faq2A: 'We accept credit card payments, bank transfers, and cash on arrival depending on the loft conditions.',
    faq3Q: 'Can I cancel my reservation?',
    faq3A: 'Yes, according to each loft cancellation policy. Most offer free cancellation up to 48 hours before arrival.',
    faq4Q: 'Are the lofts verified?',
    faq4A: 'Absolutely. Every loft is inspected by our team, professionally photographed and regularly evaluated.',
    faq5Q: 'Do you offer discounts for long stays?',
    faq5A: 'Yes, we offer preferential rates for stays of 7 nights or more. Contact us for a personalized quote.',
    ownerEyebrow: 'Owners',
    ownerTitle: 'Grow your property\u2019s value, without the hassle',
    ownerSubtitle:
      'Entrust us with your loft and increase your rental income by up to 40%, with complete peace of mind.',
    ownerB1: 'Complete, transparent management',
    ownerB2: 'Professional photography and styling',
    ownerB3: 'Round-the-clock guest service',
    ownerB4: 'Secured income, no hidden fees',
    ownerCta: 'Estimate my income',
    ownerCtaSecondary: 'Call us',
    avgRevenue: 'Average monthly revenue',
    revenueUp: 'Average revenue increase',
    ctaTitle: 'Your next stay begins here',
    ctaSubtitle: 'Tell us where and when. We take care of the rest.',
    ctaPrimary: 'Browse lofts',
    ctaSecondary: 'WhatsApp',
    newsletterTitle: 'Stay informed',
    newsletterSubtitle: 'Receive our best addresses and exclusive offers.',
    newsletterPlaceholder: 'Your email address',
    newsletterButton: 'Subscribe',
    newsletterPrivacy: 'No spam. Unsubscribe anytime.',
    footerTagline: 'Premium loft rentals in Algeria',
    footerExplore: 'Explore',
    footerLofts: 'Our lofts',
    footerOwners: 'Become a partner',
    footerAbout: 'About',
    footerContact: 'Contact',
    footerClient: 'Client area',
    rights: 'All rights reserved',
  },
  ar: {
    heroEyebrow: '\u0634\u0642\u0642 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629 \u2014 \u0627\u0644\u062c\u0632\u0627\u0626\u0631 \u00b7 \u0648\u0647\u0631\u0627\u0646 \u00b7 \u0642\u0633\u0646\u0637\u064a\u0646\u0629',
    heroTitle: '\u0645\u0633\u062a\u0642\u0628\u0644 \u0627\u0644\u0636\u064a\u0627\u0641\u0629 \u0627\u0644\u062c\u0632\u0627\u0626\u0631\u064a\u0629',
    heroSubtitle:
      '\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646\u062a\u0642\u0627\u0629 \u0645\u0646 \u0627\u0644\u0634\u0642\u0642 \u0627\u0644\u0641\u0627\u062e\u0631\u0629. \u062d\u062c\u0632 \u0630\u0643\u064a\u060c \u0648\u0635\u0648\u0644 \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633\u060c \u062a\u062c\u0631\u0628\u0629 \u063a\u0627\u0645\u0631\u0629.',
    heroCtaPrimary: '\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0634\u0642\u0642',
    heroCtaSecondary: '\u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628',
    scroll: '\u0627\u0643\u062a\u0634\u0641',
    statsGuests: '\u0636\u064a\u0648\u0641 \u0627\u0633\u062a\u0642\u0628\u0644\u0646\u0627\u0647\u0645',
    statsLofts: '\u0634\u0642\u0642 \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629',
    statsCities: '\u0645\u062f\u0646',
    statsRating: '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u062a\u0642\u064a\u064a\u0645',
    collectionEyebrow: '\u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629',
    collectionTitle: '\u0645\u0633\u0627\u062d\u0627\u062a \u062a\u0639\u064a\u062f \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0625\u0642\u0627\u0645\u0629',
    collectionSubtitle:
      '\u064a\u062a\u0645 \u0641\u062d\u0635 \u0643\u0644 \u0634\u0642\u0629 \u0648\u062a\u0635\u0648\u064a\u0631\u0647\u0627 \u0648\u0635\u064a\u0627\u0646\u062a\u0647\u0627 \u0628\u0646\u0641\u0633 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062f\u0642\u0629.',
    perNight: '/ \u0644\u064a\u0644\u0629',
    view: '\u0639\u0631\u0636 \u0627\u0644\u0634\u0642\u0629',
    viewAll: '\u0639\u0631\u0636 \u0643\u0644 \u0627\u0644\u0634\u0642\u0642',
    promiseEyebrow: '\u0648\u0639\u062f\u0646\u0627',
    promiseTitle: '\u0631\u0627\u062d\u0629 \u0627\u0644\u0641\u0646\u062f\u0642\u060c \u0631\u0648\u062d \u0627\u0644\u0645\u0646\u0632\u0644',
    feat1Title: '\u0627\u062e\u062a\u064a\u0627\u0631 \u062f\u0642\u064a\u0642',
    feat1Desc: '\u0634\u0642\u0642 \u0623\u0642\u0644 \u0648\u0644\u0643\u0646 \u0623\u0641\u0636\u0644. \u0644\u0627 \u0646\u062f\u0631\u062c \u0625\u0644\u0627 \u0645\u0627 \u064a\u0639\u062c\u0628\u0646\u0627 \u062d\u0642\u0627\u064b.',
    feat2Title: '\u0648\u0635\u0648\u0644 \u0633\u0644\u0633',
    feat2Desc: '\u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644 \u0645\u0631\u0646\u060c \u062a\u0639\u0644\u064a\u0645\u0627\u062a \u0648\u0627\u0636\u062d\u0629\u060c \u0641\u0631\u064a\u0642 \u0645\u062a\u0627\u062d \u0641\u064a \u0623\u064a \u0648\u0642\u062a.',
    feat3Title: '\u062b\u0642\u0629 \u0648\u0623\u0645\u0627\u0646',
    feat3Desc: '\u062f\u0641\u0639 \u0622\u0645\u0646\u060c \u0634\u0642\u0642 \u0645\u0648\u062b\u0642\u0629\u060c \u0635\u0648\u0631 \u062d\u0642\u064a\u0642\u064a\u0629. \u0645\u0627 \u062a\u0631\u0627\u0647 \u0647\u0648 \u0645\u0627 \u062a\u0639\u064a\u0634\u0647.',
    testimonialsEyebrow: '\u0622\u0631\u0627\u0621 \u0627\u0644\u0639\u0645\u0644\u0627\u0621',
    testimonialsTitle: '\u0639\u0627\u0634\u0648\u0627 \u0627\u0644\u062a\u062c\u0631\u0628\u0629',
    testimonial1:
      '\u0625\u0642\u0627\u0645\u0629 \u0645\u062b\u0627\u0644\u064a\u0629 \u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0646\u0647\u0627\u064a\u0629. \u0627\u0644\u0634\u0642\u0629 \u0643\u0627\u0646\u062a \u0623\u062c\u0645\u0644 \u0645\u0646 \u0627\u0644\u0635\u0648\u0631\u060c \u0648\u0627\u0644\u0627\u0633\u062a\u0642\u0628\u0627\u0644 \u0643\u0627\u0646 \u062f\u0627\u0641\u0626\u0627\u064b.',
    testimonial1Author: '\u0633\u0627\u0631\u0629 \u0645.',
    testimonial1Role: '\u0628\u0627\u0631\u064a\u0633\u060c \u0641\u0631\u0646\u0633\u0627',
    testimonial2:
      '\u0623\u0633\u0627\u0641\u0631 \u0643\u062b\u064a\u0631\u0627\u064b \u0644\u0644\u0639\u0645\u0644 \u0625\u0644\u0649 \u0627\u0644\u062c\u0632\u0627\u0626\u0631. Loft Alg\u00e9rie \u0623\u0635\u0628\u062d \u0639\u0646\u0648\u0627\u0646\u064a \u0627\u0644\u0645\u0648\u062b\u0648\u0642. \u062c\u0648\u062f\u0629 \u062b\u0627\u0628\u062a\u0629\u060c \u062e\u062f\u0645\u0629 \u0644\u0627 \u062a\u0634\u0648\u0628\u0647\u0627 \u0634\u0627\u0626\u0628\u0629.',
    testimonial2Author: '\u0643\u0631\u064a\u0645 \u0628.',
    testimonial2Role: '\u0628\u0631\u0648\u0643\u0633\u0644\u060c \u0628\u0644\u062c\u064a\u0643\u0627',
    testimonial3:
      '\u0623\u062c\u0631\u0646\u0627 Candy Loft \u0644\u0634\u0647\u0631 \u0627\u0644\u0639\u0633\u0644. \u0633\u0627\u062d\u0631. \u0627\u0644\u0633\u0637\u062d\u060c \u0627\u0644\u0625\u0636\u0627\u0621\u0629\u060c \u0627\u0644\u062f\u064a\u0643\u0648\u0631... \u0643\u0644 \u0634\u064a\u0621 \u0643\u0627\u0646 \u0645\u062b\u0627\u0644\u064a\u0627\u064b.',
    testimonial3Author: '\u0623\u0645\u064a\u0646 \u0648\u0644\u064a\u0646\u0627',
    testimonial3Role: '\u0644\u064a\u0648\u0646\u060c \u0641\u0631\u0646\u0633\u0627',
    processEyebrow: '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644',
    processTitle: '\u0625\u0642\u0627\u0645\u062a\u0643 \u0641\u064a 3 \u062e\u0637\u0648\u0627\u062a',
    processStep1Title: '\u0627\u062e\u062a\u0631',
    processStep1Desc: '\u062a\u0635\u0641\u062d \u0645\u062c\u0645\u0648\u0639\u062a\u0646\u0627 \u0648\u0627\u0639\u062b\u0631 \u0639\u0644\u0649 \u0627\u0644\u0634\u0642\u0629 \u0627\u0644\u062a\u064a \u062a\u0646\u0627\u0633\u0628\u0643.',
    processStep2Title: '\u0627\u062d\u062c\u0632',
    processStep2Desc: '\u0627\u062d\u062c\u0632 \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0628\u062f\u0648\u0646 \u0648\u0633\u064a\u0637. \u062f\u0641\u0639 \u0622\u0645\u0646.',
    processStep3Title: '\u0627\u0633\u062a\u0645\u062a\u0639',
    processStep3Desc: '\u0648\u0635\u0648\u0644 \u0633\u0644\u0633\u060c \u0627\u0633\u062a\u0642\u0628\u0627\u0644 \u0634\u062e\u0635\u064a. \u062a\u0628\u062f\u0623 \u0625\u0642\u0627\u0645\u062a\u0643.',
    faqEyebrow: '\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629',
    faqTitle: '\u0643\u0644 \u0645\u0627 \u062a\u062d\u062a\u0627\u062c \u0645\u0639\u0631\u0641\u062a\u0647',
    faq1Q: '\u0643\u064a\u0641 \u0623\u062d\u062c\u0632 \u0634\u0642\u0629\u061f',
    faq1A: '\u062a\u0635\u0641\u062d \u0645\u062c\u0645\u0648\u0639\u062a\u0646\u0627\u060c \u0627\u062e\u062a\u0631 \u0634\u0642\u062a\u0643 \u0648\u0627\u062d\u062c\u0632 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a. \u064a\u0645\u0643\u0646\u0643 \u0623\u064a\u0636\u0627\u064b \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u062d\u062c\u0632 \u0645\u062e\u0635\u0635.',
    faq2Q: '\u0645\u0627 \u0637\u0631\u0642 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0645\u0642\u0628\u0648\u0644\u0629\u061f',
    faq2A: '\u0646\u0642\u0628\u0644 \u0627\u0644\u062f\u0641\u0639 \u0628\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0628\u0646\u0643\u064a\u0629\u060c \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0628\u0646\u0643\u064a\u060c \u0648\u0627\u0644\u0646\u0642\u062f \u0639\u0646\u062f \u0627\u0644\u0648\u0635\u0648\u0644 \u062d\u0633\u0628 \u0634\u0631\u0648\u0637 \u0643\u0644 \u0634\u0642\u0629.',
    faq3Q: '\u0647\u0644 \u064a\u0645\u0643\u0646\u0646\u064a \u0625\u0644\u063a\u0627\u0621 \u062d\u062c\u0632\u064a\u061f',
    faq3A: '\u0646\u0639\u0645\u060c \u062d\u0633\u0628 \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u0625\u0644\u063a\u0627\u0621 \u0644\u0643\u0644 \u0634\u0642\u0629. \u0645\u0639\u0638\u0645\u0647\u0627 \u064a\u0642\u062f\u0645 \u0625\u0644\u063a\u0627\u0621 \u0645\u062c\u0627\u0646\u064a \u062d\u062a\u0649 48 \u0633\u0627\u0639\u0629 \u0642\u0628\u0644 \u0627\u0644\u0648\u0635\u0648\u0644.',
    faq4Q: '\u0647\u0644 \u0627\u0644\u0634\u0642\u0642 \u0645\u0648\u062b\u0642\u0629\u061f',
    faq4A: '\u0628\u0627\u0644\u062a\u0623\u0643\u064a\u062f. \u0643\u0644 \u0634\u0642\u0629 \u064a\u062a\u0645 \u062a\u0641\u062a\u064a\u0634\u0647\u0627 \u0645\u0646 \u0641\u0631\u064a\u0642\u0646\u0627\u060c \u062a\u0635\u0648\u064a\u0631\u0647\u0627 \u0628\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629\u060c \u0648\u062a\u0642\u064a\u064a\u0645\u0647\u0627 \u0628\u0627\u0646\u062a\u0638\u0627\u0645.',
    faq5Q: '\u0647\u0644 \u062a\u0642\u062f\u0645\u0648\u0646 \u062e\u0635\u0648\u0645\u0627\u062a \u0644\u0644\u0625\u0642\u0627\u0645\u0627\u062a \u0627\u0644\u0637\u0648\u064a\u0644\u0629\u061f',
    faq5A: '\u0646\u0639\u0645\u060c \u0646\u0642\u062f\u0645 \u0623\u0633\u0639\u0627\u0631\u0627\u064b \u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u0625\u0642\u0627\u0645\u0627\u062a 7 \u0644\u064a\u0627\u0644 \u0623\u0648 \u0623\u0643\u062b\u0631. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0644\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0639\u0631\u0636 \u0645\u062e\u0635\u0635.',
    ownerEyebrow: '\u0627\u0644\u0645\u0627\u0644\u0643\u0648\u0646',
    ownerTitle: '\u0627\u0631\u0641\u0639 \u0642\u064a\u0645\u0629 \u0639\u0642\u0627\u0631\u0643\u060c \u062f\u0648\u0646 \u0639\u0646\u0627\u0621',
    ownerSubtitle:
      '\u0627\u0639\u0647\u062f \u0625\u0644\u064a\u0646\u0627 \u0628\u0625\u062f\u0627\u0631\u0629 \u0634\u0642\u062a\u0643 \u0648\u0627\u0631\u0641\u0639 \u062f\u062e\u0644\u0643 \u0627\u0644\u0625\u064a\u062c\u0627\u0631\u064a \u062d\u062a\u0649 40%\u060c \u0628\u0643\u0644 \u0627\u0637\u0645\u0626\u0646\u0627\u0646.',
    ownerB1: '\u0625\u062f\u0627\u0631\u0629 \u0643\u0627\u0645\u0644\u0629 \u0648\u0634\u0641\u0627\u0641\u0629',
    ownerB2: '\u062a\u0635\u0648\u064a\u0631 \u0627\u062d\u062a\u0631\u0627\u0641\u064a \u0648\u062a\u0646\u0633\u064a\u0642',
    ownerB3: '\u062e\u062f\u0645\u0629 \u0636\u064a\u0648\u0641 \u0639\u0644\u0649 \u0645\u062f\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629',
    ownerB4: '\u062f\u062e\u0644 \u0645\u0636\u0645\u0648\u0646\u060c \u0628\u062f\u0648\u0646 \u0631\u0633\u0648\u0645 \u062e\u0641\u064a\u0629',
    ownerCta: '\u0642\u062f\u0651\u0631 \u062f\u062e\u0644\u064a',
    ownerCtaSecondary: '\u0627\u062a\u0635\u0644 \u0628\u0646\u0627',
    avgRevenue: '\u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u062f\u062e\u0644 \u0627\u0644\u0634\u0647\u0631\u064a',
    revenueUp: '\u0645\u062a\u0648\u0633\u0637 \u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u062f\u062e\u0644',
    ctaTitle: '\u0625\u0642\u0627\u0645\u062a\u0643 \u0627\u0644\u0642\u0627\u062f\u0645\u0629 \u062a\u0628\u062f\u0623 \u0647\u0646\u0627',
    ctaSubtitle: '\u0623\u062e\u0628\u0631\u0646\u0627 \u0623\u064a\u0646 \u0648\u0645\u062a\u0649. \u0646\u062d\u0646 \u0646\u062a\u0648\u0644\u0651\u0649 \u0627\u0644\u0628\u0627\u0642\u064a.',
    ctaPrimary: '\u062a\u0635\u0641\u062d \u0627\u0644\u0634\u0642\u0642',
    ctaSecondary: '\u0648\u0627\u062a\u0633\u0627\u0628',
    newsletterTitle: '\u0627\u0628\u0642\u064e \u0639\u0644\u0649 \u0627\u0637\u0644\u0627\u0639',
    newsletterSubtitle: '\u0627\u062d\u0635\u0644 \u0639\u0644\u0649 \u0623\u0641\u0636\u0644 \u0639\u0646\u0627\u0648\u064a\u0646\u0646\u0627 \u0648\u0639\u0631\u0648\u0636\u0646\u0627 \u0627\u0644\u062d\u0635\u0631\u064a\u0629.',
    newsletterPlaceholder: '\u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    newsletterButton: '\u0627\u0634\u062a\u0631\u0643',
    newsletterPrivacy: '\u0644\u0627 \u0631\u0633\u0627\u0626\u0644 \u0645\u0632\u0639\u062c\u0629. \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643 \u0641\u064a \u0623\u064a \u0648\u0642\u062a.',
    footerTagline: '\u062a\u0623\u062c\u064a\u0631 \u0634\u0642\u0642 \u0641\u0627\u062e\u0631\u0629 \u0641\u064a \u0627\u0644\u062c\u0632\u0627\u0626\u0631',
    footerExplore: '\u0627\u0633\u062a\u0643\u0634\u0641',
    footerLofts: '\u0634\u0642\u0642\u0646\u0627',
    footerOwners: '\u0643\u0646 \u0634\u0631\u064a\u0643\u0627\u064b',
    footerAbout: '\u0645\u0646 \u0646\u062d\u0646',
    footerContact: '\u0627\u062a\u0635\u0627\u0644',
    footerClient: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0639\u0645\u064a\u0644',
    rights: '\u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629',
  },
} as const;

function formatPrice(value?: number) {
  return (value || 0).toLocaleString('fr-FR');
}

function GlowOrb({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  );
}

function GlassCard({
  children,
  className = '',
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${
        hover ? 'transition-all duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.3)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6 }}
      className="mb-4 inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400"
    >
      {children}
    </motion.p>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  index,
}: {
  quote: string;
  author: string;
  role: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="p-8 sm:p-10" hover>
        <Quote className="mb-6 h-8 w-8 text-cyan-400/50" strokeWidth={1.5} />
        <p className="mb-8 text-base leading-relaxed text-gray-300">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-400">
            {author.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{author}</div>
            <div className="text-xs text-gray-500">{role}</div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function FaqItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-5 text-left sm:px-8"
      >
        <span className="text-base font-medium text-white sm:text-lg">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10"
        >
          <ChevronDown className="h-4 w-4 text-cyan-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="border-t border-white/10 px-6 pb-6 pt-4 text-sm leading-relaxed text-gray-400 sm:px-8">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingV5({ locale }: LandingV5Props) {
  const t = copy[locale as keyof typeof copy] || copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [email, setEmail] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOverlayOpacity = useTransform(scrollYProgress, [0, 1], [0.4, 0.8]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public/featured-lofts?limit=12&randomize=true', {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.lofts) && data.lofts.length > 0) {
          setLofts(data.lofts);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const heroLoft = lofts[0];
  const collection = useMemo(() => lofts.slice(0, 8), [lofts]);

  const goToSearch = () => {
    window.location.href = `/${locale}/client/search`;
  };
  const goToPartner = () => {
    window.location.href = `/${locale}/register?role=partner`;
  };

  const stats = [
    { value: '2 500+', label: t.statsGuests, icon: Users },
    { value: '150+', label: t.statsLofts, icon: Building2 },
    { value: '12', label: t.statsCities, icon: Globe },
    { value: '4,9', label: t.statsRating, icon: Star },
  ];

  const features = [
    { icon: Sparkles, title: t.feat1Title, desc: t.feat1Desc },
    { icon: KeyRound, title: t.feat2Title, desc: t.feat2Desc },
    { icon: ShieldCheck, title: t.feat3Title, desc: t.feat3Desc },
  ];

  const revenues = [
    { city: 'Alger \u00b7 Hydra', amount: '45 000 DA' },
    { city: 'Oran \u00b7 Centre', amount: '38 000 DA' },
    { city: 'Constantine', amount: '28 000 DA' },
  ];

  const ownerBenefits = [t.ownerB1, t.ownerB2, t.ownerB3, t.ownerB4];

  const testimonials = [
    { quote: t.testimonial1, author: t.testimonial1Author, role: t.testimonial1Role },
    { quote: t.testimonial2, author: t.testimonial2Author, role: t.testimonial2Role },
    { quote: t.testimonial3, author: t.testimonial3Author, role: t.testimonial3Role },
  ];

  const processSteps = [
    { icon: Search, title: t.processStep1Title, desc: t.processStep1Desc },
    { icon: Calendar, title: t.processStep2Title, desc: t.processStep2Desc },
    { icon: Heart, title: t.processStep3Title, desc: t.processStep3Desc },
  ];

  const faqItems = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen w-full overflow-x-hidden bg-[#05050a] text-white antialiased"
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <PublicHeader locale={locale} text={{ login: t.footerClient }} />

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="relative h-[100dvh] min-h-[650px] w-full overflow-hidden"
      >
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 scale-110">
          {heroLoft?.photo && (
            <Image
              src={heroLoft.photo}
              alt={heroLoft.name || 'Loft Alg\u00e9rie'}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          )}
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-[#05050a]/60 via-[#05050a]/40 to-[#05050a]" />

        <motion.div
          style={{ opacity: heroOverlayOpacity }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-900/30 via-transparent to-amber-900/20"
        />

        <GlowOrb className="-left-32 -top-32 h-96 w-96 bg-cyan-500/20" />
        <GlowOrb className="-bottom-32 -right-32 h-96 w-96 bg-amber-500/15" />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05050a]" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-24 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-gray-400 backdrop-blur-sm"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            {t.heroEyebrow}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl text-5xl font-bold leading-[1.05] text-white sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t.heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-cyan-400/40"
            >
              {t.heroCtaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t.heroCtaSecondary}
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-[10px] uppercase tracking-[0.3em]">{t.scroll}</span>
            <div className="h-8 w-[1px] bg-gradient-to-b from-cyan-400/50 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative border-y border-white/5">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16"
              >
                <Icon className="mb-3 h-5 w-5 text-cyan-400" strokeWidth={1.5} />
                <div
                  className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ─── FEATURED LOFTS (horizontal scroll) ─── */}
      <section id="featured-lofts" className="relative overflow-hidden py-24">
        <div className="mx-auto mb-14 flex max-w-6xl items-end justify-between px-6 sm:px-8">
          <div>
            <SectionEyebrow>{t.collectionEyebrow}</SectionEyebrow>
            <h2
              className="max-w-xl text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.collectionTitle}
            </h2>
            <p
              className="mt-4 max-w-lg text-gray-400"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {t.collectionSubtitle}
            </p>
          </div>
          <button
            onClick={goToSearch}
            className="group hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 md:inline-flex"
          >
            {t.viewAll}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-6 overflow-x-auto px-6 pb-4 sm:px-8"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {collection.map((loft, i) => (
            <motion.a
              key={loft.id}
              href={
                loft.id.startsWith('fallback')
                  ? `/${locale}/client/search`
                  : `/${locale}/client/lofts/${loft.id}`
              }
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group w-[320px] shrink-0 snap-start sm:w-[380px]"
            >
              <GlassCard className="overflow-hidden" hover>
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  {loft.photo && (
                    <Image
                      src={loft.photo}
                      alt={loft.name}
                      fill
                      sizes="380px"
                      className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05050a]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3
                      className="text-xl font-bold text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {loft.name}
                    </h3>
                    {(loft.zone || loft.address) && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        {loft.zone || loft.address}
                      </p>
                    )}
                  </div>
                  <div className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-sm font-bold text-amber-400">
                      {formatPrice(loft.price_per_night)} DA
                    </span>
                    <span className="ml-1 text-xs text-gray-400">{t.perNight}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.a>
          ))}
        </div>

        <div className="mt-8 flex justify-center px-6 sm:px-8 md:hidden">
          <button
            onClick={goToSearch}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ─── FEATURES / PROMISE ─── */}
      <section className="relative border-t border-white/5 py-24">
        <GlowOrb className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 bg-cyan-500/10" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8">
          <div className="mb-16 max-w-2xl">
            <SectionEyebrow>{t.promiseEyebrow}</SectionEyebrow>
            <h2
              className="text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.promiseTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <GlassCard className="p-8 sm:p-10" hover>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15">
                      <Icon className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <h3
                      className="mb-3 text-xl font-bold text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="mb-14 max-w-2xl">
            <SectionEyebrow>{t.testimonialsEyebrow}</SectionEyebrow>
            <h2
              className="text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.testimonialsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((tmn, i) => (
              <TestimonialCard
                key={i}
                quote={tmn.quote}
                author={tmn.author}
                role={tmn.role}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative border-t border-white/5 py-24">
        <GlowOrb className="absolute bottom-0 right-0 h-80 w-80 bg-amber-500/10" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 flex justify-center">
              <SectionEyebrow>{t.processEyebrow}</SectionEyebrow>
            </div>
            <h2
              className="text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.processTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                >
                  <GlassCard className="relative p-8 text-center sm:p-10" hover>
                    <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/30">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10">
                      <Icon className="h-7 w-7 text-cyan-400" strokeWidth={1.5} />
                    </div>
                    <h3
                      className="mb-3 text-xl font-bold text-white"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-400">
                      {step.desc}
                    </p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── OWNERS ─── */}
      <section className="relative border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
            >
              <SectionEyebrow>{t.ownerEyebrow}</SectionEyebrow>
              <h2
                className="max-w-md text-3xl font-bold leading-tight text-white sm:text-5xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {t.ownerTitle}
              </h2>
              <p
                className="mt-5 max-w-md text-gray-400"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {t.ownerSubtitle}
              </p>
              <ul className="mt-8 space-y-4">
                {ownerBenefits.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex items-start gap-3 text-gray-300"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                    <span>{b}</span>
                  </motion.li>
                ))}
              </ul>
              <div
                className="mt-10 flex flex-col gap-3 sm:flex-row"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <button
                  onClick={goToPartner}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-500"
                >
                  {t.ownerCta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </button>
                <a
                  href={PHONE_LINK}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {t.ownerCtaSecondary}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <GlassCard className="p-8 sm:p-10" hover>
                <div
                  className="flex items-center gap-2 text-gray-400"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <TrendingUp className="h-5 w-5 text-cyan-400" strokeWidth={1.5} />
                  <span className="text-sm">{t.avgRevenue}</span>
                </div>
                <div className="mt-7 space-y-5">
                  {revenues.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0"
                    >
                      <span className="text-gray-400">{r.city}</span>
                      <span
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {r.amount}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/10 p-6 text-center">
                  <div
                    className="text-5xl font-bold text-amber-400"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    +40%
                  </div>
                  <div
                    className="mt-1 text-sm text-gray-400"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {t.revenueUp}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="relative border-t border-white/5 py-24">
        <GlowOrb className="absolute -left-32 top-1/2 h-72 w-72 -translate-y-1/2 bg-cyan-500/10" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8">
          <div className="mb-14 text-center">
            <div className="mb-4 flex justify-center">
              <SectionEyebrow>{t.faqEyebrow}</SectionEyebrow>
            </div>
            <h2
              className="text-3xl font-bold leading-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.faqTitle}
            </h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-[#05050a] to-amber-900/20" />
        <GlowOrb className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-cyan-500/15" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center sm:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-bold leading-tight text-white sm:text-6xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {t.ctaTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-gray-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.ctaSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <button
              onClick={goToSearch}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-500 hover:shadow-cyan-400/50"
            >
              {t.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-10 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" />
              {t.ctaSecondary}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="p-8 sm:p-12" hover={false}>
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15">
                  <Mail className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
                </div>
                <h3
                  className="text-2xl font-bold text-white sm:text-3xl"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {t.newsletterTitle}
                </h3>
                <p className="mt-3 text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {t.newsletterSubtitle}
                </p>
                <div
                  className="mt-8 flex flex-col gap-3 sm:flex-row"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.newsletterPlaceholder}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm text-white outline-none backdrop-blur-sm transition-colors placeholder:text-gray-500 focus:border-cyan-500/40"
                  />
                  <button className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-400 hover:to-cyan-500">
                    {t.newsletterButton}
                  </button>
                </div>
                <p
                  className="mt-4 text-xs text-gray-500"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {t.newsletterPrivacy}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5">
        <div
          className="mx-auto max-w-6xl px-6 py-16 sm:px-8"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <div
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Loft Alg\u00e9rie
              </div>
              <p className="mt-3 max-w-xs text-sm text-gray-500">{t.footerTagline}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500">{t.footerExplore}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a
                    href="#featured-lofts"
                    className="text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    {t.footerLofts}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/register?role=partner`}
                    className="text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    {t.footerOwners}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/public/about`}
                    className="text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    {t.footerAbout}
                  </a>
                </li>
                <li>
                  <a
                    href={`/${locale}/login`}
                    className="text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    {t.footerClient}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-gray-500">{t.footerContact}</h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a
                    href={PHONE_LINK}
                    className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-400"
                  >
                    <Mail className="h-4 w-4" />
                    {EMAIL}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 sm:flex-row">
            <span>
              &copy; {new Date().getFullYear()} Loft Alg\u00e9rie \u2014 {t.rights}
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4,9 / 5
            </span>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
