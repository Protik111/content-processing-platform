import http from './http';

export type JobType = 'TEXT_EXTRACTION' | 'SUMMARY';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Job {
  id: string;
  userId: string;
  filePath: string;
  type: JobType;
  status: JobStatus;
  result: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function uploadContent(file: File, type: JobType): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await http.post('/api/v1/content', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getJob(id: string): Promise<Job> {
  const res = await http.get(`/api/v1/content/${id}`);
  return res.data.data;
}

export async function getAllJobs(): Promise<Job[]> {
  const res = await http.get('/api/v1/content');
  return res.data.data;
}
