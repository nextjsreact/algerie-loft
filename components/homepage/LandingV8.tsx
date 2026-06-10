'use client';

/**
 * LandingV8 — "Editorial Luxe"
 * Style magazine de luxe : noir profond, typographie XXL, photos pleine page,
 * layout asymétrique, ambiance Vogue / AD / Elle Décor.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Phone, Star, ChevronDown } from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV8Props { locale: string }

type Loft = {
  id: string; name: string; address?: string;
  price_per_night?: number; zone?: string; photo?: string;
};

const WHATSAPP_URL = 'https://wa.me/213560362543';
const PHONE_DISPLAY = '+213 56 03 62 543';
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
    issue: 'No. 01 — 2025',
    title1: 'SÉJOUR',
    title2: 'AUTREMENT',
    subtitle: 'Les plus beaux lofts d\'Algérie, réunis pour vous.',
    cta: 'Voir la collection',
    ctaOwner: 'Devenir partenaire',
    no: 'N°',
    perNight: '/nuit',
    statsLabel1: 'Lofts sélectionnés', statsLabel2: 'Villes', statsLabel3: 'Voyageurs', statsLabel4: 'Note',
    chapter1: 'LA COLLECTION',
    chapter1Sub: 'Des espaces pensés pour ceux qui refusent l\'ordinaire.',
    chapter2: 'POUR LES PROPRIÉTAIRES',
    chapter2Sub: 'Confiez-nous votre loft. Nous en faisons une adresse.',
    chapter2Body: 'Nos équipes s\'occupent de tout : mise en valeur, gestion des réservations, service voyageurs. Vous percevez des revenus. Nous gérons.',
    chapter2Cta: 'Estimer mes revenus',
    testimonialTitle: 'ILS L\'ONT VÉCU',
    t1: '"Un séjour parfait. Le loft était encore plus beau que les photos."',
    t1n: '— Sarah M., Paris',
    t2: '"Je ne logerai jamais à l\'hôtel quand je suis à Alger. Qualité constante, service excellent."',
    t2n: '— Karim B., Bruxelles',
    t3: '"Notre lune de miel restera gravée à jamais. Magique."',
    t3n: '— Amine & Lina, Lyon',
    finalTitle: 'VOTRE PROCHAIN\nSÉJOUR COMMENCE ICI.',
    finalCta: 'Explorer les lofts',
    contact: 'Contact',
    rights: 'Tous droits réservés',
    login: 'Connexion',
  },
  en: {
    issue: 'No. 01 — 2025',
    title1: 'STAY',
    title2: 'DIFFERENT',
    subtitle: 'The finest lofts in Algeria, curated for you.',
    cta: 'See the collection',
    ctaOwner: 'Become a partner',
    no: 'N°',
    perNight: '/night',
    statsLabel1: 'Selected lofts', statsLabel2: 'Cities', statsLabel3: 'Guests', statsLabel4: 'Rating',
    chapter1: 'THE COLLECTION',
    chapter1Sub: 'Spaces designed for those who refuse the ordinary.',
    chapter2: 'FOR OWNERS',
    chapter2Sub: 'Entrust us your loft. We make it an address.',
    chapter2Body: 'Our teams handle everything: styling, booking management, guest service. You earn income. We manage.',
    chapter2Cta: 'Estimate my revenue',
    testimonialTitle: 'THEY LIVED IT',
    t1: '"A perfect stay. The loft was even more beautiful than the photos."',
    t1n: '— Sarah M., Paris',
    t2: '"I never stay in a hotel when I\'m in Algiers. Consistent quality, excellent service."',
    t2n: '— Karim B., Brussels',
    t3: '"Our honeymoon will be etched in our hearts forever. Magical."',
    t3n: '— Amine & Lina, Lyon',
    finalTitle: 'YOUR NEXT STAY\nSTARTS HERE.',
    finalCta: 'Explore lofts',
    contact: 'Contact',
    rights: 'All rights reserved',
    login: 'Login',
  },
  ar: {
    issue: 'العدد 01 — 2025',
    title1: 'إقامة',
    title2: 'مختلفة',
    subtitle: 'أفضل الشقق في الجزائر، مختارة لك.',
    cta: 'اكتشف المجموعة',
    ctaOwner: 'كن شريكاً',
    no: 'رقم',
    perNight: '/ليلة',
    statsLabel1: 'شقق مختارة', statsLabel2: 'مدن', statsLabel3: 'ضيوف', statsLabel4: 'التقييم',
    chapter1: 'المجموعة',
    chapter1Sub: 'فضاءات مصممة لمن يرفض العادي.',
    chapter2: 'للمالكين',
    chapter2Sub: 'اعهد إلينا بشقتك. سنجعلها عنواناً.',
    chapter2Body: 'فريقنا يتولى كل شيء: الإدارة والحجوزات وخدمة الضيوف. أنت تجني الدخل، نحن ندير.',
    chapter2Cta: 'احسب دخلي',
    testimonialTitle: 'عاشوا التجربة',
    t1: '"إقامة مثالية. كانت الشقة أجمل من الصور."',
    t1n: '— سارة م.، باريس',
    t2: '"لن أقيم في الفندق حين أكون بالجزائر. جودة دائمة وخدمة ممتازة."',
    t2n: '— كريم ب.، بروكسل',
    t3: '"شهر عسلنا سيبقى في القلب إلى الأبد."',
    t3n: '— أمين ولينا، ليون',
    finalTitle: 'إقامتك القادمة\nتبدأ من هنا.',
    finalCta: 'استكشف الشقق',
    contact: 'اتصل',
    rights: 'جميع الحقوق محفوظة',
    login: 'تسجيل الدخول',
  },
} as const;

const p = (n?: number) => (n || 0).toLocaleString('fr-FR');

export default function LandingV8({ locale }: LandingV8Props) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    fetch('/api/public/featured-lofts?limit=12&randomize=true')
      .then(r => r.json()).then(d => { if (d?.lofts?.length) setLofts(d.lofts); }).catch(() => {});
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const goto = (path: string) => { window.location.href = `/${locale}${path}`; };

  const stats = [
    { v: '150+', l: t.statsLabel1 }, { v: '12', l: t.statsLabel2 },
    { v: '2 500+', l: t.statsLabel3 }, { v: '4,9★', l: t.statsLabel4 },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen w-full overflow-x-hidden bg-[#0a0a0a] text-white antialiased selection:bg-white selection:text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500&display=swap');
        .font-editorial { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans-v8 { font-family: 'Inter', sans-serif; }
        .scrollbar-none::-webkit-scrollbar { display:none; }
        .scrollbar-none { scrollbar-width: none; }
        .clip-editorial { clip-path: polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%); }
      `}</style>

      {/* Custom cursor glow */}
      <motion.div
        className="pointer-events-none fixed z-[100] h-96 w-96 rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #c9a96e 0%, transparent 70%)', left: cursor.x - 192, top: cursor.y - 192 }}
        animate={{ left: cursor.x - 192, top: cursor.y - 192 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      />

      <PublicHeader locale={locale} text={{ login: t.login }} />

      {/* ═══ HERO — Full dark, editorial ═══ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] w-full overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          {lofts[0]?.photo && (
            <Image src={lofts[0].photo} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
          )}
        </motion.div>
        {/* Dark grain */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#0a0a0a]" />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 flex h-full flex-col">
          {/* Issue number top */}
          <div className="flex items-center justify-between px-8 pt-28 md:px-16 font-sans-v8">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/30">{t.issue}</span>
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/30">LOFT ALGÉRIE</span>
          </div>

          {/* Main title — massive, left-aligned */}
          <div className="mt-auto px-8 pb-24 md:px-16">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-editorial leading-[0.85] tracking-tighter text-white">
                <span className="block text-[18vw] font-light italic">{t.title1}</span>
                <span className="block text-[18vw] font-light">{t.title2}</span>
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
            >
              <p className="max-w-sm text-sm leading-relaxed text-white/50 font-sans-v8">{t.subtitle}</p>
              <button
                onClick={() => goto('/client/search')}
                className="group inline-flex items-center gap-3 border border-white/20 px-8 py-3.5 text-sm font-medium text-white transition-all hover:bg-white hover:text-black font-sans-v8"
              >
                {t.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="h-5 w-5 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ STATS — Horizontal rule with numbers ═══ */}
      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="py-10 px-8 text-center"
            >
              <div className="font-editorial text-5xl font-light tracking-tight text-white sm:text-6xl">{s.v}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30 font-sans-v8">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ COLLECTION — Magazine grid ═══ */}
      <section className="bg-[#0d0d0d] py-24 px-8 md:px-16">
        <div className="mb-16">
          <motion.p
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="mb-3 text-[10px] uppercase tracking-[0.5em] text-[#c9a96e] font-sans-v8"
          >
            {t.chapter1}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-editorial text-6xl font-light italic text-white sm:text-8xl"
          >
            {t.chapter1Sub}
          </motion.h2>
        </div>

        {/* Featured — 2 large + grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Large feature */}
          {lofts[0] && (
            <motion.a
              href={lofts[0].id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${lofts[0].id}`}
              initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="group relative lg:col-span-7 overflow-hidden"
              style={{ height: '65vh', minHeight: 400 }}
            >
              {lofts[0].photo && <Image src={lofts[0].photo} alt={lofts[0].name} fill sizes="60vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-8">
                <span className="font-sans-v8 text-[10px] uppercase tracking-[0.4em] text-[#c9a96e]">{t.no}01</span>
                <h3 className="font-editorial mt-2 text-3xl font-light italic text-white">{lofts[0].name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60 font-sans-v8">
                  <MapPin className="h-3 w-3" />{lofts[0].zone}
                  <span className="ml-4 text-white">{p(lofts[0].price_per_night)} DA{t.perNight}</span>
                </div>
              </div>
            </motion.a>
          )}

          {/* Side column */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {lofts.slice(1, 3).map((loft, i) => (
              <motion.a
                key={loft.id}
                href={loft.id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="group relative flex-1 overflow-hidden"
                style={{ minHeight: '30vh' }}
              >
                {loft.photo && <Image src={loft.photo} alt={loft.name} fill sizes="40vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <span className="font-sans-v8 text-[10px] uppercase tracking-[0.4em] text-[#c9a96e]">{t.no}0{i + 2}</span>
                  <h3 className="font-editorial mt-1 text-xl font-light italic text-white">{loft.name}</h3>
                  <p className="text-xs text-white/50 font-sans-v8">{loft.zone} · {p(loft.price_per_night)} DA{t.perNight}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* More lofts row */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
          {lofts.slice(3, 6).map((loft, i) => (
            <motion.a
              key={loft.id}
              href={loft.id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative overflow-hidden"
              style={{ height: '35vh', minHeight: 200 }}
            >
              {loft.photo && <Image src={loft.photo} alt={loft.name} fill sizes="33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/20" />
              <div className="absolute bottom-0 p-5">
                <h3 className="font-editorial text-lg font-light italic text-white">{loft.name}</h3>
                <p className="text-xs text-white/50 font-sans-v8">{loft.zone}</p>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => goto('/client/search')}
            className="group inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white font-sans-v8"
          >
            Voir toutes les adresses
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      {/* ═══ FOR OWNERS — Dark split ═══ */}
      <section className="relative overflow-hidden bg-[#111] py-0">
        <div className="mx-auto grid min-h-[80vh] max-w-full grid-cols-1 lg:grid-cols-2">
          <div className="flex items-center justify-center px-10 py-20 md:px-20 lg:py-0 order-2 lg:order-1">
            <div className="max-w-md">
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="mb-4 text-[10px] uppercase tracking-[0.5em] text-[#c9a96e] font-sans-v8"
              >
                {t.chapter2}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="font-editorial text-5xl font-light italic text-white sm:text-6xl lg:text-7xl leading-[1.05]"
              >
                {t.chapter2Sub}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 text-base leading-relaxed text-white/40 font-sans-v8"
              >
                {t.chapter2Body}
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-col gap-3 sm:flex-row"
              >
                <button
                  onClick={() => goto('/register?role=partner')}
                  className="inline-flex items-center justify-center gap-3 bg-[#c9a96e] px-8 py-4 text-sm font-medium text-black transition-all hover:bg-[#b8945a] font-sans-v8"
                >
                  {t.chapter2Cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a href={`tel:+213560362543`} className="inline-flex items-center justify-center gap-2 border border-white/20 px-8 py-4 text-sm text-white/60 transition-all hover:text-white font-sans-v8">
                  <Phone className="h-4 w-4" />{PHONE_DISPLAY}
                </a>
              </motion.div>

              {/* Revenue cards */}
              <div className="mt-12 grid grid-cols-2 gap-3">
                {[{ city: 'Alger · Hydra', rev: '45 000 DA' }, { city: 'Oran · Centre', rev: '38 000 DA' }].map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="rounded border border-white/10 p-4"
                  >
                    <div className="font-editorial text-2xl font-light text-[#c9a96e]">{r.rev}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/30 font-sans-v8">{r.city}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="relative min-h-[50vh] order-1 lg:order-2">
            {lofts[3]?.photo && <Image src={lofts[3].photo} alt="" fill sizes="50vw" className="object-cover grayscale opacity-60" />}
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="bg-[#0a0a0a] px-8 py-24 md:px-16">
        <motion.h2
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mb-16 text-[10px] uppercase tracking-[0.6em] text-[#c9a96e] font-sans-v8"
        >
          {t.testimonialTitle}
        </motion.h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {[{ q: t.t1, n: t.t1n }, { q: t.t2, n: t.t2n }, { q: t.t3, n: t.t3n }].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="border-t border-white/10 pt-8"
            >
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-[#c9a96e] text-[#c9a96e]" />
                ))}
              </div>
              <p className="font-editorial text-xl font-light italic leading-relaxed text-white/80">{item.q}</p>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-white/30 font-sans-v8">{item.n}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden bg-[#0d0d0d] px-8 py-32 text-center md:px-16">
        {lofts[4]?.photo && (
          <div className="absolute inset-0">
            <Image src={lofts[4].photo} alt="" fill sizes="100vw" className="object-cover opacity-10" />
          </div>
        )}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="font-editorial text-5xl font-light italic leading-tight text-white sm:text-7xl lg:text-8xl whitespace-pre-line"
          >
            {t.finalTitle}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <button
              onClick={() => goto('/client/search')}
              className="group inline-flex items-center gap-3 bg-white px-10 py-4 text-sm font-medium text-black transition-all hover:bg-[#c9a96e] font-sans-v8"
            >
              {t.finalCta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-10 py-4 text-sm text-white/60 transition-all hover:text-white font-sans-v8"
            >
              <Phone className="h-4 w-4" /> WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] px-8 py-12 md:px-16">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <div className="font-editorial text-2xl font-light italic text-white">Loft Algérie</div>
            <p className="mt-1 text-xs text-white/20 font-sans-v8">&copy; {new Date().getFullYear()} — {t.rights}</p>
          </div>
          <nav className="flex flex-wrap gap-8 text-xs uppercase tracking-[0.3em] font-sans-v8">
            {[
              { label: 'Lofts', href: `/${locale}/client/search` },
              { label: locale === 'fr' ? 'Propriétaires' : 'Owners', href: `/${locale}/register?role=partner` },
              { label: t.contact, href: `mailto:${EMAIL}` },
            ].map(link => (
              <a key={link.label} href={link.href} className="text-white/30 transition-colors hover:text-white">{link.label}</a>
            ))}
          </nav>
          <div className="text-right">
            <div className="text-xs text-white/20 font-sans-v8">{PHONE_DISPLAY}</div>
            <div className="text-xs text-white/20 font-sans-v8">{EMAIL}</div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
