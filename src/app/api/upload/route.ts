import { NextRequest, NextResponse } from 'next/server';
import { saveImage, getProject, saveProject, getUploadsDir } from '@/lib/storage';
import { generateMockSegments } from '@/lib/mock-segments';
import { ImageRecord } from '@/lib/types';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const imageId = uuid();
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${imageId}${ext}`;
    const uploadsDir = getUploadsDir();
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    // Get image dimensions (approximate from file for demo)
    // In real app, use sharp or similar
    const width = 1920;
    const height = 1080;

    // Generate mock segments
    const segments = generateMockSegments(width, height);

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

    return NextResponse.json(image, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
