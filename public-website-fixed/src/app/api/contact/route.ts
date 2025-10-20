import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  propertyType?: string;
  budget?: string;
  variant?: string;
  propertyId?: string;
  serviceName?: string;
  timestamp?: string;
  userAgent?: string;
  referrer?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ContactFormData = await request.json();
    
    // Validation basique
    if (!data.name || !data.email || !data.phone || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Préparer les données pour l'envoi
    const emailData = {
      to: process.env.CONTACT_EMAIL || 'contact@loft-algerie.com',
      subject: `Nouveau contact: ${data.subject}`,
      html: generateEmailHTML(data),
      replyTo: data.email,
    };

    // Log pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Contact Form Submission:', {
        name: data.name,
        email: data.email,
        subject: data.subject,
        variant: data.variant,
        timestamp: data.timestamp,
      });
    }

    // En production, ici vous enverriez l'email via votre service préféré
    // (SendGrid, Nodemailer, etc.)
    
    // Simuler l'envoi d'email
    await simulateEmailSending(emailData);

    // Envoyer email de confirmation au client
    const confirmationEmail = {
      to: data.email,
      subject: 'Confirmation de réception - Loft Algérie',
      html: generateConfirmationHTML(data),
    };
    
    await simulateEmailSending(confirmationEmail);

    // Sauvegarder dans une base de données (optionnel)
    // await saveContactSubmission(data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Message envoyé avec succès',
        id: generateSubmissionId()
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors du traitement du formulaire:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Générer l'email HTML pour l'équipe
function generateEmailHTML(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nouveau contact - Loft Algérie</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Nouveau Contact - Loft Algérie</h1>
        </div>
        
        <div class="content">
          <div class="field">
            <div class="label">Nom:</div>
            <div class="value">${data.name}</div>
          </div>
          
          <div class="field">
            <div class="label">Email:</div>
            <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Téléphone:</div>
            <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Sujet:</div>
            <div class="value">${data.subject}</div>
          </div>
          
          ${data.propertyType ? `
          <div class="field">
            <div class="label">Type de propriété:</div>
            <div class="value">${data.propertyType}</div>
          </div>
          ` : ''}
          
          ${data.budget ? `
          <div class="field">
            <div class="label">Budget:</div>
            <div class="value">${data.budget}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">Message:</div>
            <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="field">
            <div class="label">Informations techniques:</div>
            <div class="value">
              <strong>Type:</strong> ${data.variant || 'default'}<br>
              <strong>Date:</strong> ${data.timestamp || new Date().toISOString()}<br>
              <strong>Référent:</strong> ${data.referrer || 'Direct'}<br>
              ${data.propertyId ? `<strong>Propriété ID:</strong> ${data.propertyId}<br>` : ''}
              ${data.serviceName ? `<strong>Service:</strong> ${data.serviceName}<br>` : ''}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Répondez rapidement pour maintenir notre excellent service client !</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Générer l'email de confirmation pour le client
function generateConfirmationHTML(data: ContactFormData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmation - Loft Algérie</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .cta { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Merci pour votre message !</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${data.name}</strong>,</p>
          
          <p>Nous avons bien reçu votre message concernant "<strong>${data.subject}</strong>" et nous vous en remercions.</p>
          
          <p>Notre équipe va examiner votre demande et vous répondra dans les <strong>24 heures</strong>.</p>
          
          <p>En attendant, n'hésitez pas à :</p>
          <ul>
            <li>Consulter notre <a href="${process.env.NEXT_PUBLIC_SITE_URL}/portfolio">portfolio</a></li>
            <li>Découvrir nos <a href="${process.env.NEXT_PUBLIC_SITE_URL}/services">services</a></li>
            <li>Nous appeler directement au <strong>+213 1 23 45 67 89</strong></li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}" class="cta">Visiter notre site</a>
          </div>
        </div>
        
        <div class="footer">
          <p>
            <strong>Loft Algérie</strong><br>
            123 Rue Didouche Mourad, Alger Centre<br>
            Tél: +213 1 23 45 67 89<br>
            Email: contact@loft-algerie.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Simuler l'envoi d'email (remplacer par vraie implémentation)
async function simulateEmailSending(emailData: any): Promise<void> {
  // En développement, juste logger
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email simulé:', {
      to: emailData.to,
      subject: emailData.subject,
    });
    return;
  }
  
  // En production, utiliser un vrai service d'email
  // Exemple avec SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send(emailData);
  */
  
  // Simuler un délai
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Générer un ID unique pour la soumission
function generateSubmissionId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Optionnel: Sauvegarder en base de données
async function saveContactSubmission(data: ContactFormData): Promise<void> {
  // Implémenter la sauvegarde selon votre base de données
  // (MongoDB, PostgreSQL, etc.)
}