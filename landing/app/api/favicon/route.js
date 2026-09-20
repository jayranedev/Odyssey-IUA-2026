export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return new Response('Missing domain', { status: 400 });
  }

  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
    const buffer = await res.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    return new Response('Failed to fetch favicon', { status: 500 });
  }
}
