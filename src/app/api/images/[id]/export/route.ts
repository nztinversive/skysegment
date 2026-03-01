import { NextRequest, NextResponse } from 'next/server';
import { getImage } from '@/lib/storage';
import { CLASS_LABELS } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const image = getImage(params.id);
  if (!image) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const format = req.nextUrl.searchParams.get('format') || 'geojson';

  if (format === 'geojson') {
    const geojson = {
      type: 'FeatureCollection',
      features: image.segments.map(seg => ({
        type: 'Feature',
        properties: {
          id: seg.id,
          class: seg.classLabel,
          label: CLASS_LABELS[seg.classLabel],
          areaPx: seg.areaPx,
          areaPercent: seg.areaPercent,
          confidence: seg.confidence,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[...seg.polygon.map(([x, y]) => [x, y]), seg.polygon[0]]],
        },
      })),
    };
    return new NextResponse(JSON.stringify(geojson, null, 2), {
      headers: {
        'Content-Type': 'application/geo+json',
        'Content-Disposition': `attachment; filename="${image.originalName}_segments.geojson"`,
      },
    });
  }

  if (format === 'csv') {
    const header = 'id,class,label,area_px,area_percent,confidence,bbox_x,bbox_y,bbox_w,bbox_h\n';
    const rows = image.segments.map(s =>
      `${s.id},${s.classLabel},${CLASS_LABELS[s.classLabel]},${s.areaPx},${s.areaPercent},${s.confidence},${s.bbox.join(',')}`
    ).join('\n');
    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${image.originalName}_segments.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported format. Use geojson or csv.' }, { status: 400 });
}
