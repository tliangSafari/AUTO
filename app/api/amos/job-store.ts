// Shared job status store for AMOS (Locus and PowerTrack)
// This ensures job statuses are shared between endpoints

interface JobStatus {
  status: 'starting' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  startTime?: string
  completedAt?: string
  files?: Array<{
    fileName: string
    size: number
    created: string
    downloadUrl: string
  }>
  recordCount?: number
  error?: string
}

// Global job status store
const jobStatuses = new Map<string, JobStatus>()

export function setJobStatus(jobId: string, status: JobStatus) {
  jobStatuses.set(jobId, status)
}

export function getJobStatus(jobId: string): JobStatus | undefined {
  return jobStatuses.get(jobId)
}

export function hasJob(jobId: string): boolean {
  return jobStatuses.has(jobId)
}

export { jobStatuses }