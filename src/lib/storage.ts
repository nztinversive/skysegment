import fs from 'fs';
import path from 'path';
import { Project, ImageRecord } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

function ensureDirs() {
  [DATA_DIR, PROJECTS_DIR, UPLOADS_DIR].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

// Projects
export function getProjects(): Project[] {
  ensureDirs();
  const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('img_'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8')));
}

export function getProject(id: string): Project | null {
  const fp = path.join(PROJECTS_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function saveProject(project: Project): void {
  ensureDirs();
  fs.writeFileSync(path.join(PROJECTS_DIR, `${project.id}.json`), JSON.stringify(project, null, 2));
}

// Images
export function getImage(id: string): ImageRecord | null {
  const fp = path.join(PROJECTS_DIR, `img_${id}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function saveImage(image: ImageRecord): void {
  ensureDirs();
  fs.writeFileSync(path.join(PROJECTS_DIR, `img_${image.id}.json`), JSON.stringify(image, null, 2));
}

export function getProjectImages(projectId: string): ImageRecord[] {
  const project = getProject(projectId);
  if (!project) return [];
  return project.imageIds.map(id => getImage(id)).filter(Boolean) as ImageRecord[];
}

export function getUploadsDir(): string {
  ensureDirs();
  return UPLOADS_DIR;
}
