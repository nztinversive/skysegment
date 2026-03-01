import { NextRequest, NextResponse } from 'next/server';
import { getImage, getUploadsDir } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const image = getImage(params.id);
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const filePath = path.join(getUploadsDir(), image.filename);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(image.filename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.tiff' || ext === '.tif' ? 'image/tiff' : 'image/jpeg';

  return new NextResponse(buffer, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
  });
}
