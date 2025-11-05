"use server"

import { createClient } from '@/utils/supabase/server';
import { logSuperuserAudit } from './auth';

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface PasswordResetEmailData {
  email: string;
  temporaryPassword: string;
  resetBy: 'superuser' | 'admin' | 'system';
  userFullName?: string;
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  email: string,
  temporaryPassword: string,
  resetBy: 'superuser' | 'admin' | 'system' = 'superuser',
  userFullName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = generatePasswordResetTemplate({
      email,
      temporaryPassword,
      resetBy,
      userFullName
    });

    // For now, we'll log the email content and store it in the database
    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    
    const supabase = await createClient(true);
    
    // Store email in notifications or email_queue table
    const { error: emailError } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: email,
        subject: template.subject,
        html_body: template.htmlBody,
        text_body: template.textBody,
        email_type: 'password_reset',
        status: 'pending',
        metadata: {
          reset_by: resetBy,
          temporary_password_provided: true
        },
        created_at: new Date().toISOString()
      });

    if (emailError) {
      console.error('Error storing email notification:', emailError);
      return { success: false, error: 'Failed to queue email' };
    }

    // Log the email sending attempt
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'send_password_reset_email',
      recipient_email: email,
      reset_by: resetBy
    }, { severity: 'MEDIUM' });

    // TODO: Integrate with actual email service
    console.log('Password reset email queued for:', email);
    console.log('Temporary password:', temporaryPassword);

    return { success: true };

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send bulk password reset notification
 */
export async function sendBulkPasswordResetNotification(
  resetData: PasswordResetEmailData[],
  resetBy: 'superuser' | 'admin' | 'system' = 'superuser'
): Promise<{
  success: boolean;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results = [];

  for (const data of resetData) {
    const result = await sendPasswordResetEmail(
      data.email,
      data.temporaryPassword,
      resetBy,
      data.userFullName
    );

    results.push({
      email: data.email,
      success: result.success,
      error: result.error
    });
  }

  const successCount = results.filter(r => r.success).length;
  
  return {
    success: successCount > 0,
    results
  };
}

/**
 * Generate password reset email template
 */
function generatePasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
  const { email, temporaryPassword, resetBy, userFullName } = data;
  
  const resetByText = resetBy === 'superuser' ? 'un super-administrateur' : 
                     resetBy === 'admin' ? 'un administrateur' : 'le système';

  const subject = 'Réinitialisation de votre mot de passe - LoftAlgerie';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Réinitialisation de mot de passe</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .password-box { 
          background-color: #f8f9fa; 
          border: 2px solid #007bff; 
          padding: 15px; 
          margin: 20px 0; 
          text-align: center;
          font-family: monospace;
          font-size: 18px;
          font-weight: bold;
        }
        .warning { 
          background-color: #fff3cd; 
          border: 1px solid #ffeaa7; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px;
        }
        .footer { 
          background-color: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LoftAlgerie</h1>
          <h2>Réinitialisation de mot de passe</h2>
        </div>
        
        <div class="content">
          <p>Bonjour${userFullName ? ` ${userFullName}` : ''},</p>
          
          <p>Votre mot de passe a été réinitialisé par ${resetByText}. Voici votre nouveau mot de passe temporaire :</p>
          
          <div class="password-box">
            ${temporaryPassword}
          </div>
          
          <div class="warning">
            <strong>Important :</strong>
            <ul>
              <li>Ce mot de passe est temporaire et doit être changé lors de votre prochaine connexion</li>
              <li>Pour des raisons de sécurité, ne partagez pas ce mot de passe</li>
              <li>Connectez-vous dès que possible pour définir un nouveau mot de passe</li>
            </ul>
          </div>
          
          <p>Pour vous connecter :</p>
          <ol>
            <li>Rendez-vous sur la page de connexion</li>
            <li>Utilisez votre adresse email : <strong>${email}</strong></li>
            <li>Utilisez le mot de passe temporaire ci-dessus</li>
            <li>Vous serez invité à créer un nouveau mot de passe</li>
          </ol>
          
          <p>Si vous n'avez pas demandé cette réinitialisation ou si vous avez des questions, contactez immédiatement l'équipe d'administration.</p>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système LoftAlgerie.</p>
          <p>Ne répondez pas à cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
LoftAlgerie - Réinitialisation de mot de passe

Bonjour${userFullName ? ` ${userFullName}` : ''},

Votre mot de passe a été réinitialisé par ${resetByText}.

Votre nouveau mot de passe temporaire : ${temporaryPassword}

IMPORTANT :
- Ce mot de passe est temporaire et doit être changé lors de votre prochaine connexion
- Pour des raisons de sécurité, ne partagez pas ce mot de passe
- Connectez-vous dès que possible pour définir un nouveau mot de passe

Pour vous connecter :
1. Rendez-vous sur la page de connexion
2. Utilisez votre adresse email : ${email}
3. Utilisez le mot de passe temporaire ci-dessus
4. Vous serez invité à créer un nouveau mot de passe

Si vous n'avez pas demandé cette réinitialisation ou si vous avez des questions, 
contactez immédiatement l'équipe d'administration.

---
Cet email a été envoyé automatiquement par le système LoftAlgerie.
Ne répondez pas à cet email.
  `;

  return {
    subject,
    htmlBody,
    textBody
  };
}

// Import utility functions
import { generateSecureTemporaryPassword } from './utils';

// Re-export for backward compatibility
export { generateSecureTemporaryPassword };

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmation(
  email: string,
  userFullName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = 'Confirmation - Mot de passe modifié - LoftAlgerie';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mot de passe modifié</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .success { 
            background-color: #d4edda; 
            border: 1px solid #c3e6cb; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px;
            color: #155724;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LoftAlgerie</h1>
            <h2>Mot de passe modifié avec succès</h2>
          </div>
          
          <div class="content">
            <p>Bonjour${userFullName ? ` ${userFullName}` : ''},</p>
            
            <div class="success">
              <strong>✓ Votre mot de passe a été modifié avec succès</strong>
            </div>
            
            <p>Cette confirmation vous informe que votre mot de passe a été changé le ${new Date().toLocaleString('fr-FR')}.</p>
            
            <p>Si vous n'avez pas effectué cette modification, contactez immédiatement l'équipe d'administration.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
LoftAlgerie - Mot de passe modifié avec succès

Bonjour${userFullName ? ` ${userFullName}` : ''},

Votre mot de passe a été modifié avec succès le ${new Date().toLocaleString('fr-FR')}.

Si vous n'avez pas effectué cette modification, contactez immédiatement l'équipe d'administration.
    `;

    const supabase = await createClient(true);
    
    const { error: emailError } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: email,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        email_type: 'password_change_confirmation',
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (emailError) {
      return { success: false, error: 'Failed to queue confirmation email' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error sending password reset confirmation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}