import { NextRequest, NextResponse } from 'next/server';

const PSGC_BASE = 'https://psgc.cloud/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const segment = path?.join('/') ?? '';
  const url = `${PSGC_BASE}/${segment}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('PSGC proxy error:', err);
    return new NextResponse(JSON.stringify({ value: [], Count: 0 }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
