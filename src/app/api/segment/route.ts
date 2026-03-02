import { NextRequest, NextResponse } from 'next/server';
import { getImage, saveImage, getUploadsDir } from '@/lib/storage';
import { segmentImage } from '@/lib/roboflow';
import path from 'path';

/**
 * POST /api/segment
 * Re-segment an existing image with custom class prompts.
 * Body: { imageId: string, classes?: { text: string, classLabel: SegmentClass }[] }
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ROBOFLOW_API_KEY) {
      return NextResponse.json({ error: 'ROBOFLOW_API_KEY not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { imageId, classes } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'imageId required' }, { status: 400 });
    }

    const image = getImage(imageId);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const filePath = path.join(getUploadsDir(), image.filename);
    const segments = await segmentImage(filePath, image.width, image.height, classes);

    // Update stored image
    image.segments = segments;
    image.segmentCount = segments.length;
    image.segmented = true;
    saveImage(image);

    return NextResponse.json({
      imageId: image.id,
      segmentCount: segments.length,
      segments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
