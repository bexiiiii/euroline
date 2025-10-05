import { apiFetch } from '../api';

export interface UploadedFile {
  id: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch<UploadedFile>('/api/files/upload', {
    method: 'POST',
    body: formData,
  });
}
