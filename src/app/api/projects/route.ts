import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProject } from '@/lib/storage';
import { Project } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const projects = getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project: Project = {
    id: uuid(),
    name: body.name || 'Untitled Project',
    description: body.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageCount: 0,
    imageIds: [],
  };
  saveProject(project);
  return NextResponse.json(project, { status: 201 });
}
