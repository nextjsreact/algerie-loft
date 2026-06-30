const attempts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = attempts.get(key)
  
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= limit) return false
  
  record.count++
  return true
}

// Nettoyage périodique (toutes les 5 min)
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of attempts) {
    if (now > record.resetAt) attempts.delete(key)
  }
}, 5 * 60 * 1000)
