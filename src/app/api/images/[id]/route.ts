import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const image = getImage(params.id);
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(image);
}
