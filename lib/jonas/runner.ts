import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

interface JonasConfig {
  type: 'vendors' | 'accounts'
  credentials: {
    clientId: string
    username: string
    password: string
  }
  vendors?: string[]
  accounts?: Array<{
    code: string
    startDate: string
    endDate: string
  }>
  email?: {
    recipient: string
    send: boolean
  }
  showBrowser?: boolean
}

interface JonasResult {
  success: boolean
  message: string
  outputPaths?: string[]
  error?: string
  jobId?: string
}

// Global warmup state - shared across all instances
let globalWarmupState = {
  hasWarmedUp: false,
  warmupTime: 0
}

export class JonasRunner {
  private pythonScript: string
  private workingDir: string
  private pythonExecutable: string
  private warmupScript: string

  constructor() {
    this.pythonScript = path.join(process.cwd(), 'automation_scripts', 'jonas', 'jonas_browser_api.py')
    this.warmupScript = path.join(process.cwd(), 'automation_scripts', 'warmup.py')
    this.workingDir = path.join(process.cwd(), 'automation_scripts', 'jonas')
    
    // Determine Python executable path - prefer virtual environment
    const venvPython = this.getVirtualEnvPython()
    this.pythonExecutable = venvPython || 'python'
    
    console.log(`Using Python executable: ${this.pythonExecutable}`)
  }

  private getVirtualEnvPython(): string | null {
    const rootDir = process.cwd()
    
    // Check for .venv in project root
    const venvPaths = [
      path.join(rootDir, '.venv', 'Scripts', 'python.exe'), // Windows
      path.join(rootDir, '.venv', 'bin', 'python'),         // Linux/Mac
      path.join(rootDir, 'venv', 'Scripts', 'python.exe'),  // Alternative Windows
      path.join(rootDir, 'venv', 'bin', 'python')           // Alternative Linux/Mac
    ]

    for (const venvPath of venvPaths) {
      try {
        // Check if the virtual environment Python exists
        if (require('fs').existsSync(venvPath)) {
          console.log(`Found virtual environment Python at: ${venvPath}`)
          return venvPath
        }
      } catch (error) {
        // Continue checking other paths
      }
    }

    console.log('No virtual environment found, using system Python')
    return null
  }

  private async runWarmup(): Promise<void> {
    // Check global warmup state
    if (globalWarmupState.hasWarmedUp) {
      const timeSinceWarmup = Date.now() - globalWarmupState.warmupTime
      console.log(`[${new Date().toISOString()}] Python already warmed up ${Math.round(timeSinceWarmup/1000)}s ago, skipping...`)
      return
    }

    const warmupStart = Date.now()
    console.log(`[${new Date().toISOString()}] Running Python warmup script...`)
    
    return new Promise((resolve) => {
      const warmupProcess = spawn(this.pythonExecutable, [this.warmupScript], {
        cwd: process.cwd()
      })

      warmupProcess.stdout.on('data', (data) => {
        console.log(`Warmup: ${data.toString().trim()}`)
      })

      warmupProcess.stderr.on('data', (data) => {
        console.error(`Warmup error: ${data.toString()}`)
      })

      warmupProcess.on('close', (code) => {
        if (code === 0) {
          globalWarmupState.hasWarmedUp = true
          globalWarmupState.warmupTime = Date.now()
          console.log(`[${new Date().toISOString()}] Python warmup completed in ${Date.now() - warmupStart}ms`)
        } else {
          console.log(`[${new Date().toISOString()}] Python warmup failed with code ${code}`)
        }
        resolve()
      })

      warmupProcess.on('error', (error) => {
        console.error(`Warmup process error: ${error.message}`)
        resolve()
      })
    })
  }

  async run(config: JonasConfig, jobId: string): Promise<JonasResult> {
    const runStart = Date.now()
    console.log(`\n[${new Date().toISOString()}] Jonas runner.run() called`)
    
    // Skip warmup - we do it at server startup now
    
    try {
      // Create a temporary config file
      const configPath = path.join(this.workingDir, `config_${jobId}_${Date.now()}.json`)
      
      // Log the config being written
      console.log(`[${new Date().toISOString()}] Writing Jonas config file: ${configPath} (${Date.now() - runStart}ms)`)
      console.log('Config contents:', JSON.stringify(config, null, 2))
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2))
      console.log(`[${new Date().toISOString()}] Config file written (${Date.now() - runStart}ms)`)

      return new Promise((resolve, reject) => {
        // Build command arguments
        const args = ['--config', configPath]
        if (config.showBrowser) {
          args.push('--show-browser')
        } else {
          args.push('--headless')
        }

        console.log(`[${new Date().toISOString()}] Running Python script: ${this.pythonExecutable} ${this.pythonScript} ${args.join(' ')} (${Date.now() - runStart}ms)`)
        console.log(`[${new Date().toISOString()}] Spawning Python process...`)
        
        // Spawn the Python process using the determined executable
        const pythonProcess = spawn(this.pythonExecutable, [this.pythonScript, ...args], {
          cwd: this.workingDir,
          env: { ...process.env, PYTHONPATH: this.workingDir }
        })

        let stdout = ''
        let stderr = ''

        // Capture stdout
        pythonProcess.stdout.on('data', (data) => {
          if (stdout.length === 0) {
            console.log(`[${new Date().toISOString()}] First Python output received (${Date.now() - runStart}ms)`)
          }
          stdout += data.toString()
          console.log('Python output:', data.toString())
          
          // You could emit progress events here
          // this.emitProgress(data.toString())
        })

        // Capture stderr
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString()
          console.error('Python error:', data.toString())
        })

        // Handle process completion
        pythonProcess.on('close', async (code) => {
          // Clean up config file
          try {
            await fs.unlink(configPath)
          } catch (error) {
            console.error('Error deleting config file:', error)
          }

          if (code === 0) {
            // Success - parse output to find downloaded file paths
            const outputPaths = this.parseOutputPaths(stdout)
            const movedPaths = await this.moveFilesToDownloads(outputPaths, jobId)

            resolve({
              success: true,
              message: 'Jonas automation completed successfully',
              outputPaths: movedPaths,
              jobId
            })
          } else {
            // Error
            reject({
              success: false,
              message: 'Jonas automation failed',
              error: stderr || stdout || 'Unknown error'
            })
          }
        })

        // Handle process errors
        pythonProcess.on('error', (error) => {
          reject({
            success: false,
            message: 'Failed to start Python process',
            error: error.message
          })
        })
      })
    } catch (error) {
      return {
        success: false,
        message: 'Error running Jonas automation',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private parseOutputPaths(stdout: string): string[] {
    const paths: string[] = []
    
    // Look for different output patterns from the Python script
    const patterns = [
      /SUCCESS: Saved HTML file to: (.+\.html)/g,
      /SUCCESS: Successfully converted HTML to Excel: (.+\.xlsx)/g,
      /Downloaded vendor report to: (.+\.xlsx)/g,
      /Downloaded account report to: (.+\.xlsx)/g,
      /SUCCESS: Downloaded .* report: (.+\.xlsx)/g,
      /SUCCESS: Downloaded .* report: (.+\.html)/g,
      /SUCCESS: Successfully downloaded: (.+\.xlsx)/g,
      /SUCCESS: Successfully downloaded: (.+\.html)/g,
      /Created demo .* file: (.+\.(xlsx|html))/g
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(stdout)) !== null) {
        if (match[1] && !paths.includes(match[1])) {
          paths.push(match[1])
        }
      }
    }

    console.log('Parsed output paths:', paths)
    return paths
  }

  private async moveFilesToDownloads(sourcePaths: string[], jobId: string): Promise<string[]> {
    const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
    await fs.mkdir(downloadsDir, { recursive: true })
    
    const movedPaths: string[] = []

    for (const sourcePath of sourcePaths) {
      try {
        // Files should now be generated in correct location
        console.log(`Processing file: ${sourcePath}`)
        
        // Check if source file exists
        await fs.access(sourcePath)
        
        const fileName = path.basename(sourcePath)
        const ext = path.extname(fileName)
        const baseName = path.basename(fileName, ext)
        
        // Create new filename with jobId prefix
        const newFileName = `${jobId}_${baseName}${ext}`
        const destinationPath = path.join(downloadsDir, newFileName)
        
        // Copy file to downloads directory
        await fs.copyFile(sourcePath, destinationPath)
        movedPaths.push(destinationPath)
        
        console.log(`Moved file: ${sourcePath} -> ${destinationPath}`)
        
        // Optionally delete original file
        try {
          await fs.unlink(sourcePath)
          console.log(`Deleted original file: ${sourcePath}`)
        } catch (deleteError) {
          console.warn(`Could not delete original file ${sourcePath}:`, deleteError)
        }
        
      } catch (error) {
        console.error(`Error moving file ${sourcePath}:`, error)
      }
    }

    return movedPaths
  }

  async checkDependencies(): Promise<boolean> {
    const checkStart = Date.now()
    console.log(`[${new Date().toISOString()}] Starting Python dependency check...`)
    
    // Skip warmup during dependency check - we do it at server startup now
    
    try {
      // Check if Python is installed and has required modules
      return new Promise((resolve) => {
        console.log(`[${new Date().toISOString()}] Spawning Python process to check dependencies...`)
        const pythonCheck = spawn(this.pythonExecutable, ['-c', 'import playwright.sync_api; import pandas; import json; print("OK")'])
        
        let stdout = ''
        let stderr = ''
        
        pythonCheck.stdout.on('data', (data) => {
          stdout += data.toString()
        })
        
        pythonCheck.stderr.on('data', (data) => {
          stderr += data.toString()
        })
        
        pythonCheck.on('close', (code) => {
          const hasPlaywright = code === 0 && stdout.includes('OK')
          console.log(`[${new Date().toISOString()}] Python dependency check completed in ${Date.now() - checkStart}ms: ${hasPlaywright ? 'PASSED' : 'FAILED'}`)
          if (!hasPlaywright) {
            console.log('Missing dependencies. Please install:')
            console.log('  python -m venv .venv')
            console.log('  .venv\\Scripts\\activate  (Windows) or source .venv/bin/activate  (Linux/Mac)')
            console.log('  pip install -r requirements.txt')
            console.log('  playwright install')
            if (stderr) {
              console.log('Error details:', stderr)
            }
          }
          resolve(hasPlaywright)
        })
        
        pythonCheck.on('error', (error) => {
          console.log(`Python executable ${this.pythonExecutable} not found:`, error.message)
          resolve(false)
        })
      })
    } catch {
      return false
    }
  }

  async installDependencies(): Promise<boolean> {
    try {
      // Install Python dependencies
      const pipInstall = spawn('pip', [
        'install',
        '-r',
        path.join(this.workingDir, 'requirements_jonas.txt')
      ], {
        cwd: this.workingDir
      })

      return new Promise((resolve) => {
        pipInstall.on('close', (code) => {
          resolve(code === 0)
        })

        pipInstall.on('error', () => {
          resolve(false)
        })
      })
    } catch {
      return false
    }
  }
}

// Singleton instance
export const jonasRunner = new JonasRunner()