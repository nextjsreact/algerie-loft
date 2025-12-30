/**
 * Valide la force d'un mot de passe (côté client)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Génère un mot de passe temporaire sécurisé (côté client)
 */
export function generateTempPassword(email: string): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const emailPrefix = email.substring(0, 3).toUpperCase()
  const randomNum = Math.floor(Math.random() * 99) + 10
  
  return `Temp${year}${emailPrefix}${randomNum}!`
}