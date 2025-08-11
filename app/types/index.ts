export interface Target {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  dataTypes: DataType[]
}

export interface DataType {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface ExtractionResult {
  dataType: string
  status: "success" | "error" | "warning"
  count: number
  data: any[]
  message?: string
}

export interface JonasCredentials {
  clientId: string
  username: string
  password: string
}

export interface WPRReport {
  id: number
  filename: string
  week: string
  generated: string
  size: string
  projects: number
  downloadUrl: string
}

export interface AutomationRun {
  id: string
  date: string
  status: "success" | "failed" | "in_progress"
  recordsProcessed: number
  duration: string
  dataTypes: string[]
  downloadUrl?: string
  errorMessage?: string
}

export interface AutomationConfig {
  schedule: string
  frequency: string
  dataTypes: string[]
  emailRecipients: string[]
  retryPolicy: string
  lastRun: string | null
  nextRun: string
  status: "active" | "paused" | "disabled"
  timezone: string
}

export interface SampleDataFile {
  id: string
  name: string
  description: string
  size: string
  type: "excel" | "csv" | "pdf"
  downloadUrl: string
  previewAvailable: boolean
}