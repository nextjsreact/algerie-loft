'use client'

import { useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import TouchButton from '@/components/ui/TouchButton';

interface ContactFormProps {
  locale: string;
}

export default function ContactForm({ locale }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const text = {
    fr: {
      name: "Nom complet",
      email: "Email",
      phone: "Téléphone",
      subject: "Sujet",
      message: "Message",
      send: "Envoyer le message",
      sending: "Envoi en cours...",
      success: "Message envoyé avec succès ! Nous vous répondrons bientôt.",
      error: "Erreur lors de l'envoi. Veuillez réessayer."
    },
    en: {
      name: "Full Name",
      email: "Email",
      phone: "Phone",
      subject: "Subject", 
      message: "Message",
      send: "Send Message",
      sending: "Sending...",
      success: "Message sent successfully! We will respond soon.",
      error: "Error sending message. Please try again."
    },
    ar: {
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      subject: "الموضوع",
      message: "الرسالة",
      send: "إرسال الرسالة",
      sending: "جاري الإرسال...",
      success: "تم إرسال الرسالة بنجاح! سنرد عليك قريباً.",
      error: "خطأ في الإرسال. يرجى المحاولة مرة أخرى."
    }
  };

  const t = text[locale as keyof typeof text] || text.fr;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just show success (in real app, would send to API)
      console.log('Contact form data:', data);
      setIsSubmitted(true);
    } catch (err) {
      setError(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
        <div className="text-green-600 dark:text-green-400 text-4xl mb-4">✓</div>
        <p className="text-green-800 dark:text-green-300 font-medium">
          {t.success}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <FormInput 
        label={t.name}
        type="text"
        name="name"
        required
        disabled={isSubmitting}
      />
      
      <FormInput 
        label={t.email}
        type="email"
        name="email"
        required
        disabled={isSubmitting}
      />
      
      <FormInput 
        label={t.phone}
        type="tel"
        name="phone"
        disabled={isSubmitting}
      />
      
      <FormInput 
        label={t.subject}
        type="text"
        name="subject"
        required
        disabled={isSubmitting}
      />
      
      <FormInput 
        label={t.message}
        type="text"
        name="message"
        rows={5}
        required
        disabled={isSubmitting}
      />
      
      <TouchButton 
        variant="primary" 
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? t.sending : t.send}
      </TouchButton>
    </form>
  );
}