'use client';

/**
 * LandingV9 — "Méditerranée Dorée"
 * Couleurs chaudes : sable, terra cotta, or. Très aéré, grande typographie serif,
 * photos circulaires et ovales. Ambiance Sud, chaleur, vacances authentiques.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, MapPin, Star, Phone, Mail, Sun, CheckCircle2 } from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV9Props { locale: string }

type Loft = {
  id: string; name: string; address?: string;
  price_per_night?: number; zone?: string; photo?: string;
};

const WHATSAPP = 'https://wa.me/213560362543';
const PHONE = '+213 56 03 62 543';
const EMAIL = 'contact@loftalgerie.com';

const fallbackLofts: Loft[] = [
  { id: 'f1', name: 'Candy Loft', zone: 'Alger Centre', price_per_night: 9000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c4931c00-1792-492d-9101-4bc583484749/e43a66e0-1929-4bd1-8df8-ddf676cf70f8.jpeg' },
  { id: 'f2', name: 'Swan Loft', zone: 'El Mouradia', price_per_night: 9000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/b305b744-5ae6-40ed-bf91-00a848a4b1bc/e4defb1a-3b52-4128-b6d5-f3155766b913.jpeg' },
  { id: 'f3', name: 'Dary Loft', zone: 'Hussein Dey', price_per_night: 9000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/bcbf0c9f-a179-49e3-be64-f61339de4c8c/f0ec4489-a4fb-4a0a-9113-8ff8bdf6f643.jpg' },
  { id: 'f4', name: 'Choco Loft', zone: 'Alger Centre', price_per_night: 10000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/0d79d0fd-41e5-4206-97d1-cb217279c7e8/ea5bfb99-18a6-47f5-8534-4b74a14cb896.jpg' },
  { id: 'f5', name: 'Dounia Loft', zone: 'Hussein Dey', price_per_night: 9000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/9be87001-9977-4f1b-8bf5-e183f9ee8d27/c5ebd720-8dc8-42d6-b6b1-88de54a6f4e4.jpg' },
  { id: 'f6', name: 'Talia Loft', zone: 'Alger Centre', price_per_night: 9000, photo: 'https://mhngbluefyucoesgcjoy.supabase.co/storage/v1/object/public/loft-photos/lofts/c8f109bc-86c2-4aa5-a472-d155b3085c15/6ba33f2e-2fb0-4503-991a-857916aca347.jpg' },
];

const copy = {
  fr: {
    eyebrow: 'Bienvenue en Algérie',
    heroTitle: 'La chaleur du Sud,\nle confort du luxe.',
    heroSub: 'Des lofts d\'exception dans les plus belles villes d\'Algérie. Réservez directement, vivez pleinement.',
    heroCta: 'Découvrir les lofts',
    heroCtaB: 'Nous écrire sur WhatsApp',
    statA: 'lofts d\'exception', statB: 'villes', statC: 'voyageurs satisfaits', statD: 'note moyenne',
    featuredTitle: 'Nos adresses coups de cœur',
    featuredSub: 'Chaque loft est choisi pour son caractère unique.',
    perNight: '/nuit',
    seeAll: 'Voir toute la collection →',
    whyTitle: 'Pourquoi choisir Loft Algérie ?',
    why1: 'Sélection rigoureuse', why1d: 'Chaque bien est visité, photographié et approuvé personnellement.',
    why2: 'Réservation directe', why2d: 'Pas d\'intermédiaire, pas de commission cachée. Vous payez ce que vous voyez.',
    why3: 'Support 24h/24', why3d: 'Notre équipe est disponible à toute heure pour vous aider.',
    why4: 'Photos réelles', why4d: 'Toutes nos photos sont authentiques. Ce que vous voyez est ce que vous vivrez.',
    tTitle: 'Ils sont revenus nous voir',
    t1: 'Le loft était exactement comme sur les photos, encore plus lumineux. L\'équipe est adorable.',
    t1a: 'Yasmine H.', t1c: 'Marseille',
    t2: 'Parfait pour notre voyage de noces. Le rooftop au coucher du soleil, inoubliable.',
    t2a: 'Riad & Nadia', t2c: 'Dubai',
    t3: 'Enfin une plateforme algérienne digne de ce nom. Professionnel et chaleureux à la fois.',
    t3a: 'Sofiane M.', t3c: 'Londres',
    ownerTitle: 'Propriétaire d\'un beau loft ?',
    ownerSub: 'Rejoignez notre réseau de partenaires et augmentez vos revenus sans vous soucier de la gestion.',
    ownerBullets: ['Gestion complète clé en main', 'Photographie professionnelle offerte', '+40% de revenus en moyenne', 'Paiements garantis et ponctuels'],
    ownerCta: 'Devenir partenaire',
    ctaTitle: 'Votre séjour de rêve\nvous attend.',
    ctaSub: 'Réservez dès maintenant et découvrez l\'Algérie autrement.',
    ctaBtn: 'Explorer les lofts',
    login: 'Connexion',
    rights: 'Tous droits réservés',
  },
  en: {
    eyebrow: 'Welcome to Algeria',
    heroTitle: 'Southern warmth,\nluxury comfort.',
    heroSub: 'Exceptional lofts in Algeria\'s most beautiful cities. Book directly, live fully.',
    heroCta: 'Discover lofts',
    heroCtaB: 'WhatsApp us',
    statA: 'exceptional lofts', statB: 'cities', statC: 'happy guests', statD: 'average rating',
    featuredTitle: 'Our favorite addresses',
    featuredSub: 'Every loft chosen for its unique character.',
    perNight: '/night',
    seeAll: 'See the full collection →',
    whyTitle: 'Why choose Loft Algeria?',
    why1: 'Rigorous selection', why1d: 'Every property personally visited, photographed and approved.',
    why2: 'Direct booking', why2d: 'No middleman, no hidden fees. You pay what you see.',
    why3: '24/7 support', why3d: 'Our team is available around the clock to help you.',
    why4: 'Real photos', why4d: 'All photos are authentic. What you see is what you experience.',
    tTitle: 'They came back',
    t1: 'The loft was exactly as in the photos, even brighter. The team is wonderful.',
    t1a: 'Yasmine H.', t1c: 'Marseille',
    t2: 'Perfect for our honeymoon. The rooftop at sunset, unforgettable.',
    t2a: 'Riad & Nadia', t2c: 'Dubai',
    t3: 'Finally an Algerian platform worthy of the name. Professional and warm at the same time.',
    t3a: 'Sofiane M.', t3c: 'London',
    ownerTitle: 'Owner of a beautiful loft?',
    ownerSub: 'Join our partner network and increase your income without worrying about management.',
    ownerBullets: ['Complete turnkey management', 'Professional photography included', '+40% revenue on average', 'Guaranteed on-time payments'],
    ownerCta: 'Become a partner',
    ctaTitle: 'Your dream stay\nawaits you.',
    ctaSub: 'Book now and discover Algeria differently.',
    ctaBtn: 'Explore lofts',
    login: 'Login',
    rights: 'All rights reserved',
  },
  ar: {
    eyebrow: 'مرحباً بك في الجزائر',
    heroTitle: 'دفء الجنوب،\nراحة الفخامة.',
    heroSub: 'شقق استثنائية في أجمل مدن الجزائر. احجز مباشرة، وعش بالكامل.',
    heroCta: 'اكتشف الشقق',
    heroCtaB: 'تواصل عبر واتساب',
    statA: 'شقق استثنائية', statB: 'مدن', statC: 'ضيوف سعداء', statD: 'متوسط التقييم',
    featuredTitle: 'عناويننا المفضلة',
    featuredSub: 'كل شقة مختارة لطابعها الفريد.',
    perNight: '/ليلة',
    seeAll: 'اعرض كل المجموعة ←',
    whyTitle: 'لماذا تختار Loft Algérie؟',
    why1: 'اختيار صارم', why1d: 'كل عقار يُزار ويُصور ويُعتمد شخصياً.',
    why2: 'حجز مباشر', why2d: 'بدون وسيط، بدون عمولات خفية.',
    why3: 'دعم 24/7', why3d: 'فريقنا متاح على مدار الساعة.',
    why4: 'صور حقيقية', why4d: 'كل الصور حقيقية. ما تراه هو ما تعيشه.',
    tTitle: 'عادوا إلينا',
    t1: 'كانت الشقة تماماً كالصور، بل أكثر إشراقاً. الفريق رائع.',
    t1a: 'ياسمين ح.', t1c: 'مرسيليا',
    t2: 'مثالي لشهر العسل. السطح عند الغروب، لا يُنسى.',
    t2a: 'رياض ونادية', t2c: 'دبي',
    t3: 'أخيراً منصة جزائرية بمستوى عالمي.',
    t3a: 'سفيان م.', t3c: 'لندن',
    ownerTitle: 'مالك شقة جميلة؟',
    ownerSub: 'انضم لشبكة شركائنا وزد دخلك دون قلق من الإدارة.',
    ownerBullets: ['إدارة كاملة مفتاح باليد', 'تصوير احترافي مجاني', '+40% دخل في المتوسط', 'مدفوعات مضمونة في الوقت'],
    ownerCta: 'كن شريكاً',
    ctaTitle: 'إقامة أحلامك\nتنتظرك.',
    ctaSub: 'احجز الآن واكتشف الجزائر بشكل مختلف.',
    ctaBtn: 'استكشف الشقق',
    login: 'تسجيل الدخول',
    rights: 'جميع الحقوق محفوظة',
  },
} as const;

const fmt = (n?: number) => (n || 0).toLocaleString('fr-FR');

export default function LandingV9({ locale }: LandingV9Props) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch('/api/public/featured-lofts?limit=12&randomize=true')
      .then(r => r.json()).then(d => { if (d?.lofts?.length) setLofts(d.lofts); }).catch(() => {});
  }, []);

  const goto = (p: string) => { window.location.href = `/${locale}${p}`; };

  const stats = [
    { v: '150+', l: t.statA }, { v: '12', l: t.statB },
    { v: '2 500+', l: t.statC }, { v: '4,9', l: t.statD },
  ];

  const why = [
    { icon: Star, title: t.why1, desc: t.why1d },
    { icon: CheckCircle2, title: t.why2, desc: t.why2d },
    { icon: Phone, title: t.why3, desc: t.why3d },
    { icon: Sun, title: t.why4, desc: t.why4d },
  ];

  const testimonials = [
    { q: t.t1, a: t.t1a, c: t.t1c },
    { q: t.t2, a: t.t2a, c: t.t2c },
    { q: t.t3, a: t.t3a, c: t.t3c },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen w-full overflow-x-hidden antialiased" style={{ backgroundColor: '#fdf6ef', color: '#1a1209' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display-v9 { font-family: 'Fraunces', Georgia, serif; }
        .font-body-v9 { font-family: 'DM Sans', sans-serif; }
        .blob { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      `}</style>

      <PublicHeader locale={locale} text={{ login: t.login }} />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen w-full overflow-hidden flex items-center">
        {/* Warm background shapes */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #fdf6ef 0%, #f5e6d3 50%, #eedcc4 100%)' }} />
        <div className="absolute top-20 right-10 w-96 h-96 opacity-20 blob" style={{ background: '#c8824a' }} />
        <div className="absolute bottom-20 left-5 w-64 h-64 opacity-15 blob" style={{ background: '#d4a572' }} />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 w-full px-6 sm:px-12 lg:px-20 pt-24 pb-16">
          <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 font-body-v9"
                style={{ background: 'rgba(200, 130, 74, 0.15)', color: '#a05a28' }}
              >
                <Sun className="h-3.5 w-3.5" />
                <span className="text-xs font-medium tracking-wide">{t.eyebrow}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="font-display-v9 text-5xl font-normal leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl whitespace-pre-line"
                style={{ color: '#1a1209' }}
              >
                {t.heroTitle}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.6 }}
                className="mt-6 max-w-md text-base leading-relaxed font-body-v9"
                style={{ color: '#6b4c2a' }}
              >
                {t.heroSub}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
              >
                <button
                  onClick={() => goto('/client/search')}
                  className="group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-medium text-white transition-all font-body-v9"
                  style={{ background: 'linear-gradient(135deg, #c8824a, #a05a28)' }}
                >
                  {t.heroCta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-sm font-medium transition-all font-body-v9"
                  style={{ borderColor: '#c8824a', color: '#a05a28' }}
                >
                  <Phone className="h-4 w-4" />{t.heroCtaB}
                </a>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                className="mt-14 grid grid-cols-4 gap-4 pt-10 border-t font-body-v9"
                style={{ borderColor: 'rgba(200, 130, 74, 0.25)' }}
              >
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display-v9 text-2xl font-normal" style={{ color: '#1a1209' }}>{s.v}</div>
                    <div className="mt-1 text-[10px] leading-tight" style={{ color: '#a07040' }}>{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — collage of oval/circle photos */}
            <div className="relative h-[550px] w-full">
              {/* Main large oval */}
              {lofts[0]?.photo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute overflow-hidden shadow-2xl"
                  style={{ width: '65%', height: '75%', top: '5%', right: isRtl ? 'auto' : '5%', left: isRtl ? '5%' : 'auto', borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }}
                >
                  <Image src={lofts[0].photo} alt={lofts[0].name} fill sizes="40vw" className="object-cover" />
                  <div className="absolute inset-0" style={{ background: 'rgba(200, 130, 74, 0.1)' }} />
                </motion.div>
              )}
              {/* Small top-left circle */}
              {lofts[1]?.photo && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="absolute overflow-hidden rounded-full shadow-xl"
                  style={{ width: '40%', height: '42%', top: 0, left: isRtl ? 'auto' : 0, right: isRtl ? 0 : 'auto' }}
                >
                  <Image src={lofts[1].photo} alt={lofts[1].name} fill sizes="25vw" className="object-cover" />
                </motion.div>
              )}
              {/* Small bottom-left oval */}
              {lofts[2]?.photo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.9 }}
                  className="absolute overflow-hidden shadow-lg"
                  style={{ width: '38%', height: '30%', bottom: '5%', left: isRtl ? 'auto' : '2%', right: isRtl ? '2%' : 'auto', borderRadius: '50%' }}
                >
                  <Image src={lofts[2].photo} alt={lofts[2].name} fill sizes="25vw" className="object-cover" />
                </motion.div>
              )}
              {/* Price badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 }}
                className="absolute rounded-2xl p-4 shadow-lg font-body-v9"
                style={{ background: '#fff', bottom: '22%', right: isRtl ? 'auto' : '2%', left: isRtl ? '2%' : 'auto' }}
              >
                <div className="font-display-v9 text-2xl font-normal" style={{ color: '#c8824a' }}>9 000 DA</div>
                <div className="text-xs mt-0.5" style={{ color: '#a07040' }}>{t.perNight}</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ FEATURED LOFTS ═══ */}
      <section id="featured-lofts" className="px-6 py-24 sm:px-12 lg:px-20" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-display-v9 text-4xl font-normal sm:text-5xl" style={{ color: '#1a1209' }}
            >
              {t.featuredTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-3 font-body-v9 text-base" style={{ color: '#a07040' }}
            >
              {t.featuredSub}
            </motion.p>
          </div>

          {/* Mosaic grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {lofts.slice(0, 6).map((loft, i) => (
              <motion.a
                key={loft.id}
                href={loft.id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 lg:col-span-2' : ''}`}
                style={{ borderRadius: i % 3 === 0 ? '2rem' : i % 3 === 1 ? '1rem 3rem' : '3rem 1rem', minHeight: i === 0 ? 400 : 260 }}
              >
                {loft.photo && (
                  <Image src={loft.photo} alt={loft.name} fill sizes={i === 0 ? '66vw' : '33vw'} className="object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 transition-opacity duration-500" style={{ background: 'linear-gradient(to top, rgba(26,18,9,0.7) 0%, transparent 60%)' }} />
                <div className="absolute bottom-0 w-full p-6">
                  <h3 className="font-display-v9 text-xl font-normal italic text-white">{loft.name}</h3>
                  <div className="mt-1 flex items-center gap-2 font-body-v9 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{loft.zone}</span>
                    <span className="ml-2 font-medium text-white">{fmt(loft.price_per_night)} DA{t.perNight}</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => goto('/client/search')}
              className="font-body-v9 text-sm font-medium transition-colors"
              style={{ color: '#c8824a' }}
            >
              {t.seeAll}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ WHY ═══ */}
      <section className="px-6 py-24 sm:px-12 lg:px-20" style={{ background: '#fdf6ef' }}>
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-14 text-center font-display-v9 text-4xl font-normal sm:text-5xl" style={{ color: '#1a1209' }}
          >
            {t.whyTitle}
          </motion.h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {why.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-3xl p-8"
                style={{ background: '#fff', border: '1px solid rgba(200,130,74,0.15)' }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(200,130,74,0.12)' }}>
                  <item.icon className="h-6 w-6" style={{ color: '#c8824a' }} />
                </div>
                <h3 className="font-display-v9 text-xl font-normal" style={{ color: '#1a1209' }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed font-body-v9" style={{ color: '#8b6540' }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-6 py-24 sm:px-12 lg:px-20" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mb-14 text-center font-display-v9 text-4xl font-normal italic sm:text-5xl" style={{ color: '#1a1209' }}
          >
            {t.tTitle}
          </motion.h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative overflow-hidden rounded-3xl p-8"
                style={{ background: 'linear-gradient(135deg, #fdf6ef, #f5e6d3)' }}
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" style={{ color: '#c8824a' }} />
                  ))}
                </div>
                <p className="font-display-v9 text-lg italic leading-relaxed" style={{ color: '#3a2010' }}>"{item.q}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-display-v9 text-base text-white" style={{ background: 'linear-gradient(135deg, #c8824a, #a05a28)' }}>
                    {item.a[0]}
                  </div>
                  <div>
                    <div className="font-body-v9 font-medium text-sm" style={{ color: '#1a1209' }}>{item.a}</div>
                    <div className="font-body-v9 text-xs" style={{ color: '#a07040' }}>{item.c}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OWNERS ═══ */}
      <section className="overflow-hidden" style={{ background: '#1a1209' }}>
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
          <div className="relative min-h-[40vh]">
            {lofts[3]?.photo && <Image src={lofts[3].photo} alt="" fill sizes="50vw" className="object-cover" />}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent, #1a1209)' }} />
          </div>
          <div className="flex items-center px-10 py-20 md:px-16">
            <div className="max-w-lg">
              <motion.h2
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="font-display-v9 text-4xl font-normal italic text-white sm:text-5xl"
              >
                {t.ownerTitle}
              </motion.h2>
              <p className="mt-4 font-body-v9 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.ownerSub}</p>
              <ul className="mt-8 space-y-3">
                {t.ownerBullets.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 font-body-v9 text-sm"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#c8824a' }} />
                    {b}
                  </motion.li>
                ))}
              </ul>
              <motion.button
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                onClick={() => goto('/register?role=partner')}
                className="mt-10 inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-medium text-white font-body-v9 transition-all"
                style={{ background: 'linear-gradient(135deg, #c8824a, #a05a28)' }}
              >
                {t.ownerCta} <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative px-6 py-32 text-center sm:px-12 lg:px-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fdf6ef, #f0dcc4)' }}>
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #c8824a, transparent)' }} />
        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display-v9 text-5xl font-normal leading-[1.1] sm:text-6xl lg:text-7xl whitespace-pre-line" style={{ color: '#1a1209' }}
          >
            {t.ctaTitle}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 font-body-v9 text-base" style={{ color: '#8b6540' }}
          >
            {t.ctaSub}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            onClick={() => goto('/client/search')}
            className="mt-10 inline-flex items-center gap-3 rounded-full px-10 py-4 text-sm font-medium text-white font-body-v9 shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #c8824a, #a05a28)' }}
          >
            {t.ctaBtn} <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t px-6 py-12 sm:px-12 lg:px-20" style={{ background: '#fdf6ef', borderColor: 'rgba(200,130,74,0.2)' }}>
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="font-display-v9 text-2xl italic" style={{ color: '#1a1209' }}>Loft Algérie</div>
            <p className="mt-1 font-body-v9 text-xs" style={{ color: '#a07040' }}>&copy; {new Date().getFullYear()} — {t.rights}</p>
          </div>
          <nav className="flex flex-wrap gap-8 font-body-v9 text-sm" style={{ color: '#8b6540' }}>
            <a href={`/${locale}/client/search`} className="hover:underline">{locale === 'fr' ? 'Nos lofts' : locale === 'ar' ? 'شققنا' : 'Our lofts'}</a>
            <a href={`/${locale}/register?role=partner`} className="hover:underline">{locale === 'fr' ? 'Propriétaires' : locale === 'ar' ? 'الملاك' : 'Owners'}</a>
            <a href={`mailto:${EMAIL}`} className="hover:underline">{EMAIL}</a>
          </nav>
          <div className="font-body-v9 text-sm" style={{ color: '#a07040' }}>{PHONE}</div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
