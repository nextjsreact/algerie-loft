'use client';

/**
 * LandingV10 — "Bold & Graphique"
 * Contrastes extrêmes noir/blanc/accent vert émeraude. Typographie massive.
 * Layout "cassé" et asymétrique. Bandes diagonales. Moderne, audacieux, mémorable.
 * Ambiance tech-luxury, comme Vercel ou Linear meets hospitality.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUpRight, MapPin, Star, Phone, Zap, Shield, Clock, Award } from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import BackToTop from '@/components/ui/BackToTop';

interface LandingV10Props { locale: string }

type Loft = {
  id: string; name: string; address?: string;
  price_per_night?: number; zone?: string; photo?: string;
};

const WHATSAPP = 'https://wa.me/213560362543';
const PHONE = '+213 56 03 62 543';
const EMAIL = 'contact@loftalgerie.com';
const ACCENT = '#00e5a0';
const DARK = '#050505';

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
    tag: '— locations de lofts en Algérie',
    h1a: 'LES PLUS',
    h1b: 'BEAUX',
    h1c: 'LOFTS.',
    sub: 'Réservez directement. Sans intermédiaire. Sans surprise.',
    cta: 'Explorer maintenant',
    ctaB: 'Parler à quelqu\'un',
    ticker: ['ALGER', 'ORAN', 'CONSTANTINE', 'ANNABA', 'TIZI OUZOU', 'SÉTIF'],
    available: 'DISPONIBLE MAINTENANT',
    night: '/nuit',
    stats: [['150+', 'Lofts'], ['12', 'Villes'], ['2 500+', 'Voyageurs'], ['4,9/5', 'Note']],
    section2: 'NOS ADRESSES',
    section2sub: 'Chaque loft, une histoire.',
    viewAll: 'Tout voir',
    guarantees: 'CE QU\'ON VOUS GARANTIT',
    g1t: 'Réservation instantanée', g1d: 'Confirmée en moins de 2 minutes.',
    g2t: 'Photos certifiées', g2d: '100% des photos sont réelles. Zéro retouche mensongère.',
    g3t: 'Support 24h/24', g3d: 'Un humain vous répond, toujours.',
    g4t: 'Meilleur prix direct', g4d: 'Pas moins cher ailleurs. Garanti.',
    ownerH: 'PROPRIÉTAIRE ?',
    ownerSub: 'Rejoignez 150+ propriétaires qui font confiance à Loft Algérie.',
    ownerCta: 'Devenir partenaire →',
    bigCta: 'RÉSERVEZ. MAINTENANT.',
    bigCtaSub: 'Des lofts d\'exception. Une plateforme sérieuse.',
    bigCtaBtn: 'Voir la collection',
    login: 'Connexion',
    rights: 'Tous droits réservés',
  },
  en: {
    tag: '— loft rentals in Algeria',
    h1a: 'THE FINEST',
    h1b: 'LOFTS',
    h1c: 'IN ALGERIA.',
    sub: 'Book directly. No middleman. No surprises.',
    cta: 'Explore now',
    ctaB: 'Talk to someone',
    ticker: ['ALGIERS', 'ORAN', 'CONSTANTINE', 'ANNABA', 'TIZI OUZOU', 'SÉTIF'],
    available: 'AVAILABLE NOW',
    night: '/night',
    stats: [['150+', 'Lofts'], ['12', 'Cities'], ['2,500+', 'Guests'], ['4.9/5', 'Rating']],
    section2: 'OUR ADDRESSES',
    section2sub: 'Each loft, a story.',
    viewAll: 'See all',
    guarantees: 'WHAT WE GUARANTEE',
    g1t: 'Instant booking', g1d: 'Confirmed in under 2 minutes.',
    g2t: 'Certified photos', g2d: '100% real photos. Zero deceptive editing.',
    g3t: '24/7 support', g3d: 'A real human answers, always.',
    g4t: 'Best direct price', g4d: 'Not cheaper anywhere. Guaranteed.',
    ownerH: 'PROPERTY OWNER?',
    ownerSub: 'Join 150+ owners who trust Loft Algeria.',
    ownerCta: 'Become a partner →',
    bigCta: 'BOOK. NOW.',
    bigCtaSub: 'Exceptional lofts. A serious platform.',
    bigCtaBtn: 'View collection',
    login: 'Login',
    rights: 'All rights reserved',
  },
  ar: {
    tag: '— تأجير الشقق في الجزائر',
    h1a: 'أجمل',
    h1b: 'الشقق',
    h1c: 'في الجزائر.',
    sub: 'احجز مباشرة. بدون وسيط. بدون مفاجآت.',
    cta: 'استكشف الآن',
    ctaB: 'تحدث مع شخص',
    ticker: ['الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'تيزي وزو', 'سطيف'],
    available: 'متاح الآن',
    night: '/ليلة',
    stats: [['150+', 'شقة'], ['12', 'مدينة'], ['2500+', 'ضيف'], ['4,9/5', 'تقييم']],
    section2: 'عناويننا',
    section2sub: 'كل شقة، قصة.',
    viewAll: 'اعرض الكل',
    guarantees: 'ما نضمنه',
    g1t: 'حجز فوري', g1d: 'تأكيد في أقل من دقيقتين.',
    g2t: 'صور معتمدة', g2d: 'كل الصور حقيقية 100%.',
    g3t: 'دعم 24/7', g3d: 'إنسان حقيقي يجيبك دائماً.',
    g4t: 'أفضل سعر مباشر', g4d: 'لا يوجد سعر أقل في مكان آخر.',
    ownerH: 'مالك عقار؟',
    ownerSub: 'انضم لـ150+ مالك يثق بـ Loft Algérie.',
    ownerCta: 'كن شريكاً ←',
    bigCta: 'احجز. الآن.',
    bigCtaSub: 'شقق استثنائية. منصة جادة.',
    bigCtaBtn: 'اعرض المجموعة',
    login: 'تسجيل الدخول',
    rights: 'جميع الحقوق محفوظة',
  },
} as const;

const fmt = (n?: number) => (n || 0).toLocaleString('fr-FR');

export default function LandingV10({ locale }: LandingV10Props) {
  const t = copy[locale as keyof typeof copy] ?? copy.fr;
  const isRtl = locale === 'ar';
  const [lofts, setLofts] = useState<Loft[]>(fallbackLofts);
  const [tickerPos, setTickerPos] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.8], [0.6, 0.2]);

  useEffect(() => {
    fetch('/api/public/featured-lofts?limit=12&randomize=true')
      .then(r => r.json()).then(d => { if (d?.lofts?.length) setLofts(d.lofts); }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTickerPos(p => p - 1), 20);
    return () => clearInterval(id);
  }, []);

  const goto = (p: string) => { window.location.href = `/${locale}${p}`; };

  const guarantees = [
    { icon: Zap, t: t.g1t, d: t.g1d },
    { icon: Shield, t: t.g2t, d: t.g2d },
    { icon: Clock, t: t.g3t, d: t.g3d },
    { icon: Award, t: t.g4t, d: t.g4d },
  ];

  const tickerItems = [...t.ticker, ...t.ticker, ...t.ticker];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen w-full overflow-x-hidden antialiased" style={{ background: DARK, color: '#ffffff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');
        .font-display-v10 { font-family: 'Syne', sans-serif; }
        .font-body-v10 { font-family: 'Space Grotesk', sans-serif; }
        .accent-v10 { color: ${ACCENT}; }
        .bg-accent-v10 { background: ${ACCENT}; }
        .border-accent-v10 { border-color: ${ACCENT}; }
        .diagonal-cut { clip-path: polygon(0 0, 100% 0, 100% 88%, 0 100%); }
        .diagonal-cut-top { clip-path: polygon(0 12%, 100% 0, 100% 100%, 0 100%); }
      `}</style>

      <PublicHeader locale={locale} text={{ login: t.login }} />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-screen w-full overflow-hidden flex items-center">
        {/* Background image */}
        <motion.div style={{ scale: imgScale, opacity: imgOpacity }} className="absolute inset-0">
          {lofts[0]?.photo && <Image src={lofts[0].photo} alt="" fill priority sizes="100vw" className="object-cover" />}
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.97) 40%, rgba(5,5,5,0.5) 100%)' }} />

        <div className="relative z-10 w-full px-6 pt-24 pb-16 sm:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 inline-flex items-center gap-3 font-body-v10"
            >
              <div className="h-px w-8" style={{ background: ACCENT }} />
              <span className="text-xs tracking-[0.4em] uppercase" style={{ color: ACCENT }}>{t.tag}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-display-v10 leading-[0.9] tracking-tight text-white"
            >
              <span className="block text-[13vw] font-bold">{t.h1a}</span>
              <span className="block text-[13vw] font-bold" style={{ WebkitTextStroke: `2px ${ACCENT}`, color: 'transparent' }}>{t.h1b}</span>
              <span className="block text-[13vw] font-bold">{t.h1c}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-8 max-w-lg text-base leading-relaxed font-body-v10"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              {t.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <button
                onClick={() => goto('/client/search')}
                className="group inline-flex items-center justify-center gap-3 px-10 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all font-body-v10"
                style={{ background: ACCENT }}
              >
                {t.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border px-10 py-4 text-sm font-medium uppercase tracking-widest transition-all font-body-v10"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}
              >
                <Phone className="h-4 w-4" />{t.ctaB}
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              className="mt-20 grid grid-cols-4 gap-8 pt-12 font-body-v10"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              {t.stats.map(([v, l], i) => (
                <div key={i}>
                  <div className="font-display-v10 text-3xl font-bold sm:text-4xl" style={{ color: i === 0 ? ACCENT : '#fff' }}>{v}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <div className="overflow-hidden border-y py-5" style={{ borderColor: ACCENT, background: ACCENT }}>
        <motion.div
          className="flex gap-16 whitespace-nowrap font-display-v10 text-sm font-bold uppercase tracking-[0.4em] text-black"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {tickerItems.map((city, i) => (
            <span key={i} className="flex items-center gap-8">
              {city}
              <span className="opacity-40">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ═══ LOFTS SECTION ═══ */}
      <section className="px-6 py-24 sm:px-12 lg:px-20" style={{ background: '#0a0a0a' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="mb-2 font-body-v10 text-xs uppercase tracking-[0.5em]" style={{ color: ACCENT }}
              >
                {t.section2}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="font-display-v10 text-5xl font-bold text-white sm:text-6xl"
              >
                {t.section2sub}
              </motion.h2>
            </div>
            <button
              onClick={() => goto('/client/search')}
              className="hidden items-center gap-2 text-sm uppercase tracking-[0.3em] font-body-v10 transition-colors md:inline-flex"
              style={{ color: ACCENT }}
            >
              {t.viewAll} <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Asymmetric grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-2">
            {/* Big left */}
            {lofts[0] && (
              <motion.a
                href={lofts[0].id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${lofts[0].id}`}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="group relative overflow-hidden md:col-span-7 md:row-span-2"
                style={{ minHeight: 480 }}
              >
                {lofts[0].photo && <Image src={lofts[0].photo} alt={lofts[0].name} fill sizes="60vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,0.9) 0%, transparent 60%)' }} />
                <div className="absolute bottom-0 w-full p-8">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black font-body-v10" style={{ background: ACCENT }}>
                    {t.available}
                  </div>
                  <h3 className="font-display-v10 text-3xl font-bold text-white">{lofts[0].name}</h3>
                  <div className="mt-2 flex items-center gap-3 font-body-v10">
                    <span className="flex items-center gap-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <MapPin className="h-3.5 w-3.5" />{lofts[0].zone}
                    </span>
                    <span className="font-bold text-white">{fmt(lofts[0].price_per_night)} DA<span style={{ color: ACCENT }}>{t.night}</span></span>
                  </div>
                </div>
              </motion.a>
            )}

            {/* Right column — 3 small */}
            {lofts.slice(1, 4).map((loft, i) => (
              <motion.a
                key={loft.id}
                href={loft.id.startsWith('f') ? `/${locale}/client/search` : `/${locale}/client/lofts/${loft.id}`}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden md:col-span-5"
                style={{ minHeight: 150 }}
              >
                {loft.photo && <Image src={loft.photo} alt={loft.name} fill sizes="35vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.8), transparent)' }} />
                <div className="absolute inset-0 flex items-center p-6">
                  <div>
                    <h3 className="font-display-v10 text-xl font-bold text-white">{loft.name}</h3>
                    <p className="font-body-v10 text-xs" style={{ color: ACCENT }}>{loft.zone}</p>
                  </div>
                  <div className="ml-auto font-body-v10 text-right">
                    <div className="font-bold text-white text-sm">{fmt(loft.price_per_night)} DA</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.night}</div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ GUARANTEES ═══ */}
      <section className="diagonal-cut px-6 py-32 sm:px-12 lg:px-20" style={{ background: '#111' }}>
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 font-display-v10 text-4xl font-bold uppercase text-white sm:text-5xl"
          >
            {t.guarantees}
          </motion.h2>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {guarantees.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-l p-8 first:border-l-0 sm:first:border-l"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center" style={{ background: 'rgba(0,229,160,0.1)' }}>
                  <g.icon className="h-5 w-5" style={{ color: ACCENT }} />
                </div>
                <h3 className="font-display-v10 text-lg font-bold text-white">{g.t}</h3>
                <p className="mt-2 text-sm leading-relaxed font-body-v10" style={{ color: 'rgba(255,255,255,0.4)' }}>{g.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OWNERS ═══ */}
      <section className="diagonal-cut-top overflow-hidden" style={{ background: ACCENT }}>
        <div className="mx-auto max-w-7xl px-6 py-28 sm:px-12 lg:px-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="font-display-v10 text-5xl font-bold leading-tight text-black sm:text-6xl lg:text-7xl"
              >
                {t.ownerH}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg font-body-v10 text-black/60"
              >
                {t.ownerSub}
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                onClick={() => goto('/register?role=partner')}
                className="mt-8 inline-flex items-center gap-2 bg-black px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all font-body-v10 hover:bg-neutral-900"
              >
                {t.ownerCta}
              </motion.button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {lofts.slice(2, 5).map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden"
                  style={{ height: i === 1 ? 260 : 200, borderRadius: 4 }}
                >
                  {l.photo && <Image src={l.photo} alt={l.name} fill sizes="20vw" className="object-cover grayscale" />}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-6 py-24 sm:px-12 lg:px-20" style={{ background: '#0a0a0a' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { q: locale === 'fr' ? '"Un séjour parfait. Le loft était encore plus beau que sur les photos."' : locale === 'ar' ? '"إقامة مثالية."' : '"A perfect stay. Even more beautiful than the photos."', n: 'Sarah M.', c: locale === 'fr' ? 'Paris' : 'Paris' },
              { q: locale === 'fr' ? '"Je ne logerai plus à l\'hôtel à Alger. Qualité irréprochable."' : locale === 'ar' ? '"لن أقيم في الفندق بعد الآن."' : '"No more hotel stays in Algiers. Impeccable quality."', n: 'Karim B.', c: locale === 'fr' ? 'Bruxelles' : 'Brussels' },
              { q: locale === 'fr' ? '"Notre lune de miel. Le rooftop au coucher du soleil. Magique."' : locale === 'ar' ? '"شهر عسلنا. ساحر."' : '"Our honeymoon. The rooftop at sunset. Magical."', n: 'Amine & Lina', c: locale === 'fr' ? 'Lyon' : 'Lyon' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border p-8"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-current" style={{ color: ACCENT }} />)}
                </div>
                <p className="font-display-v10 text-lg font-normal leading-relaxed text-white">{item.q}</p>
                <div className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="font-body-v10 font-bold text-sm text-white">{item.n}</div>
                  <div className="font-body-v10 text-xs" style={{ color: ACCENT }}>{item.c}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL BIG CTA ═══ */}
      <section className="relative overflow-hidden px-6 py-32 text-center sm:px-12" style={{ background: DARK }}>
        {/* Massive background text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden font-display-v10 text-[25vw] font-black uppercase leading-none opacity-[0.03] select-none">
          LOFT
        </div>
        <div className="relative z-10 mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="font-display-v10 text-6xl font-black uppercase leading-none text-white sm:text-8xl lg:text-[10rem]"
          >
            {t.bigCta.split('.').map((part, i) => (
              <span key={i} className={`block ${i === 1 ? 'accent-v10' : ''}`}>{part.trim()}{i < t.bigCta.split('.').length - 2 ? '.' : ''}</span>
            ))}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 font-body-v10 text-base" style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {t.bigCtaSub}
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            onClick={() => goto('/client/search')}
            className="group mt-10 inline-flex items-center gap-3 px-12 py-5 text-sm font-bold uppercase tracking-widest text-black transition-all font-body-v10"
            style={{ background: ACCENT }}
          >
            {t.bigCtaBtn}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t px-6 py-10 sm:px-12 lg:px-20" style={{ background: '#050505', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="font-display-v10 text-xl font-bold text-white">
            LOFT <span style={{ color: ACCENT }}>ALGÉRIE</span>
          </div>
          <nav className="flex flex-wrap gap-8 font-body-v10 text-xs uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <a href={`/${locale}/client/search`} className="hover:text-white transition-colors">{locale === 'fr' ? 'Lofts' : locale === 'ar' ? 'الشقق' : 'Lofts'}</a>
            <a href={`/${locale}/register?role=partner`} className="hover:text-white transition-colors">{locale === 'fr' ? 'Propriétaires' : locale === 'ar' ? 'الملاك' : 'Owners'}</a>
            <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
          </nav>
          <div className="font-body-v10 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            &copy; {new Date().getFullYear()} — {t.rights}
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
}
