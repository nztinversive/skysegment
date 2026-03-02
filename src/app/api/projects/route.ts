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
    customClasses: body.customClasses || undefined,
  };
  saveProject(project);
  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const projects = getProjects();
  const project = projects.find(p => p.id === id);
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  if (updates.customClasses !== undefined) project.customClasses = updates.customClasses;
  if (updates.name) project.name = updates.name;
  if (updates.description !== undefined) project.description = updates.description;
  project.updatedAt = new Date().toISOString();

  saveProject(project);
  return NextResponse.json(project);
}
