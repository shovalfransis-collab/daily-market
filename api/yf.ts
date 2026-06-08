export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const host = url.searchParams.get('_host') === '2'
    ? 'https://query2.finance.yahoo.com'
    : 'https://query1.finance.yahoo.com';
  const path = url.searchParams.get('_path') ?? '';

  url.searchParams.delete('_host');
  url.searchParams.delete('_path');

  const qs = url.searchParams.toString();
  const upstream = `${host}${path}${qs ? '?' + qs : ''}`;

  try {
    const res = await fetch(upstream, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MarketDaily/1.0)',
      },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
