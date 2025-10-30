// API de test pour les réservations
export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      message: 'Test API working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}