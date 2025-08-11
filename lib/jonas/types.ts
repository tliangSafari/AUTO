export interface JonasCredentials {
  clientId: string
  username: string
  password: string
}

export interface JonasVendorConfig {
  vendors: string[]
}

export interface JonasAccountConfig {
  accounts: Array<{
    code: string
    startDate: string
    endDate: string
  }>
}

export interface JonasEmailConfig {
  recipient: string
  send: boolean
}

export interface JonasJobStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  details?: any
  downloadUrl?: string
  error?: string
}

export interface JonasProcessingResult {
  success: boolean
  message: string
  jobId?: string
  outputPath?: string
  error?: string
}