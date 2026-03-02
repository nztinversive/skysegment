import { NextRequest, NextResponse } from 'next/server';
import { saveImage, getProject, saveProject, getUploadsDir } from '@/lib/storage';
import { generateMockSegments } from '@/lib/mock-segments';
import { segmentImage } from '@/lib/roboflow';
import { ImageRecord } from '@/lib/types';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

// Get image dimensions from JPEG/PNG header (no sharp dependency needed)
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  // Try JPEG (SOF0 marker)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      // SOF markers: 0xC0-0xCF except 0xC4, 0xC8, 0xCC
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  }

  // Try PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // Fallback
  return { width: 1920, height: 1080 };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const classesJson = formData.get('classes') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const imageId = uuid();
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${imageId}${ext}`;
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const { width, height } = getImageDimensions(buffer);

    // Parse custom classes if provided
    let customClasses;
    if (classesJson) {
      try { customClasses = JSON.parse(classesJson); } catch { /* ignore */ }
    }

    // Use Roboflow SAM 3 if API key is set, otherwise fall back to mocks
    let segments;
    let segmentedWith: string;
    if (process.env.ROBOFLOW_API_KEY) {
      try {
        segments = await segmentImage(filePath, width, height, customClasses);
        segmentedWith = 'sam3';
      } catch (err) {
        console.error('SAM 3 segmentation failed, falling back to mock:', err);
        segments = generateMockSegments(width, height);
        segmentedWith = 'mock';
      }
    } else {
      segments = generateMockSegments(width, height);
      segmentedWith = 'mock';
    }

    const image: ImageRecord = {
      id: imageId,
      projectId,
      filename,
      originalName: file.name,
      width,
      height,
      uploadedAt: new Date().toISOString(),
      segmented: true,
      segmentCount: segments.length,
      segments,
      thumbnailUrl: `/api/images/${imageId}/file`,
      imageUrl: `/api/images/${imageId}/file`,
    };

    saveImage(image);

    // Update project
    project.imageIds.push(imageId);
    project.imageCount = project.imageIds.length;
    project.updatedAt = new Date().toISOString();
    saveProject(project);

    return NextResponse.json({ ...image, segmentedWith }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
