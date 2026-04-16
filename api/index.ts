import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // req.url in Vercel contains the path and query string relative to the function
    const urlPattern = req.url || '';
    const path = urlPattern.replace(/^\/api\/rh/, '');
    
    const targetUrl = `https://app.chefos.online/api/rh${path}`;
    
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    // Repassa o cabeçalho de autorização enviado pelo frontend
    if (req.headers.authorization) {
      headers.append('Authorization', req.headers.authorization);
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    res.status(response.status);
    
    try {
      res.json(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
