import fs from 'fs/promises'
import path from 'path'

export interface JobFile {
  fileName: string
  filePath: string
  size: number
  created: string
  downloadUrl: string
}

export class JonasFileManager {
  private downloadsDir: string

  constructor() {
    this.downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
  }

  async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.downloadsDir)
    } catch {
      await fs.mkdir(this.downloadsDir, { recursive: true })
    }
  }

  async storeFile(jobId: string, sourceFilePath: string, originalFileName?: string): Promise<string> {
    await this.ensureDirectoryExists()

    const sanitizedJobId = jobId.replace(/[^a-zA-Z0-9]/g, '_')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const ext = path.extname(sourceFilePath)
    
    const finalFileName = originalFileName 
      ? `${sanitizedJobId}_${timestamp}_${originalFileName}`
      : `${sanitizedJobId}_${timestamp}${ext}`
    
    const destinationPath = path.join(this.downloadsDir, finalFileName)

    // Copy the file to downloads directory
    await fs.copyFile(sourceFilePath, destinationPath)

    return destinationPath
  }

  async getJobFiles(jobId: string): Promise<JobFile[]> {
    try {
      await this.ensureDirectoryExists()
      const files = await fs.readdir(this.downloadsDir)
      const sanitizedJobId = jobId.replace(/[^a-zA-Z0-9]/g, '_')
      const jobFiles: JobFile[] = []

      for (const file of files) {
        if (file.includes(sanitizedJobId)) {
          const filePath = path.join(this.downloadsDir, file)
          const stats = await fs.stat(filePath)

          jobFiles.push({
            fileName: file,
            filePath,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            downloadUrl: `/api/jonas/download?jobId=${jobId}&fileName=${encodeURIComponent(file)}`
          })
        }
      }

      // Sort by creation time (newest first)
      jobFiles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

      return jobFiles
    } catch (error) {
      console.error('Error getting job files:', error)
      return []
    }
  }

  async cleanupOldFiles(maxAgeHours: number = 24): Promise<number> {
    try {
      await this.ensureDirectoryExists()
      const files = await fs.readdir(this.downloadsDir)
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(this.downloadsDir, file)
        const stats = await fs.stat(filePath)

        if (stats.birthtime.getTime() < cutoffTime) {
          await fs.unlink(filePath)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up files:', error)
      return 0
    }
  }

  async deleteJobFiles(jobId: string): Promise<number> {
    try {
      const jobFiles = await this.getJobFiles(jobId)
      let deletedCount = 0

      for (const file of jobFiles) {
        await fs.unlink(file.filePath)
        deletedCount++
      }

      return deletedCount
    } catch (error) {
      console.error('Error deleting job files:', error)
      return 0
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase()
    
    switch (ext) {
      case '.xlsx': return 'Excel Spreadsheet'
      case '.xls': return 'Excel Legacy'
      case '.csv': return 'CSV File'
      case '.html': return 'HTML Report'
      default: return 'Unknown'
    }
  }
}

// Singleton instance
export const fileManager = new JonasFileManager()

// Cleanup function to run periodically
export async function cleanupOldDownloads() {
  const deletedCount = await fileManager.cleanupOldFiles(24)
  console.log(`Cleaned up ${deletedCount} old download files`)
  return deletedCount
}