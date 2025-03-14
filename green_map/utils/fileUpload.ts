import { writeFile } from 'fs/promises';
import path from 'path';

export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

  // Save file
  await writeFile(filePath, buffer);
  return fileName;
} 