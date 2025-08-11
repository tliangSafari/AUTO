import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'

// Simple in-memory job storage (in production, use Redis or database)
const jobStatuses = new Map()

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { 
      reportType = 'current_week',
      includeCharts = true,
      includeMaintenance = true,
      includeWeatherData = false
    } = requestBody
    
    console.log("🔵 WPR generation started:", { 
      reportType,
      includeCharts,
      includeMaintenance,
      includeWeatherData
    })

    const jobId = `wpr_job_${Date.now()}`
    
    // Initialize job status
    jobStatuses.set(jobId, {
      status: 'starting',
      progress: 0,
      message: 'Initializing WPR generation...',
      startTime: new Date().toISOString(),
      files: [],
      recordCount: 0
    })

    // Check if WPR generator script exists
    const scriptPath = path.join(process.cwd(), 'automation_scripts', 'wpr_generator.py')
    let pythonAvailable = false
    
    try {
      await fs.access(scriptPath)
      pythonAvailable = true
    } catch (error) {
      console.log('WPR generator script not available, using demo mode')
    }

    if (pythonAvailable) {
      // Run WPR generation using the generator script
      console.log('Starting WPR generation with wpr_generator.py...')
      
      // Update job status
      jobStatuses.set(jobId, {
        ...jobStatuses.get(jobId),
        status: 'processing',
        progress: 10,
        message: 'Starting WPR generation script...'
      })

      try {
        // Run the WPR generator script with arguments using virtual environment
        const pythonExe = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
        const pythonProcess = spawn(pythonExe, [
          scriptPath,
          '--report_type', reportType,
          '--include_charts', includeCharts ? 'true' : 'false',
          '--include_maintenance', includeMaintenance ? 'true' : 'false',
          '--include_weather', includeWeatherData ? 'true' : 'false'
        ], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        })

        let outputData = ''
        let errorData = ''

        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString()
          console.log('WPR Python output:', data.toString())
          
          // Update progress based on output
          const currentJob = jobStatuses.get(jobId)
          if (currentJob) {
            let progress = currentJob.progress
            let message = currentJob.message
            
            if (outputData.includes('Collecting solar project data')) {
              progress = Math.max(progress, 25)
              message = 'Collecting solar project data...'
            } else if (outputData.includes('Calculating performance metrics')) {
              progress = Math.max(progress, 50)
              message = 'Calculating performance metrics...'
            } else if (outputData.includes('Analyzing maintenance activities')) {
              progress = Math.max(progress, 75)
              message = 'Analyzing maintenance activities...'
            } else if (outputData.includes('WPR generated successfully')) {
              progress = Math.max(progress, 100)
              message = 'WPR generated successfully!'
            }
            
            jobStatuses.set(jobId, { ...currentJob, progress, message })
          }
        })

        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString()
          console.error('WPR Python error:', data.toString())
        })

        pythonProcess.on('close', async (code) => {
          console.log(`WPR Python process exited with code ${code}`)
          
          if (code === 0) {
            // Success - look for generated files in downloads directory
            try {
              const downloadsDir = path.join(process.cwd(), 'downloads', 'wpr')
              let files: string[] = []
              
              try {
                const dirContents = await fs.readdir(downloadsDir)
                files = dirContents.filter(f => f.endsWith('.csv') && f.toLowerCase().includes('wpr'))
              } catch (err) {
                console.log('WPR downloads directory not found')
                files = []
              }
              
              const fileData = await Promise.all(files.map(async (fileName) => {
                const filePath = path.join(downloadsDir, fileName)
                const stats = await fs.stat(filePath)
                return {
                  fileName,
                  size: stats.size,
                  created: stats.birthtime.toISOString(),
                  downloadUrl: `/api/wpr/download?fileName=${fileName}`
                }
              }))

              jobStatuses.set(jobId, {
                status: 'completed',
                progress: 100,
                message: `WPR generated successfully! ${files.length} file(s) ready for download.`,
                files: fileData,
                recordCount: outputData.match(/Total records: (\d+)/)?.[1] ? parseInt(outputData.match(/Total records: (\d+)/)?.[1]) : 200,
                completedAt: new Date().toISOString()
              })
            } catch (err) {
              console.error('Error processing WPR files:', err)
              jobStatuses.set(jobId, {
                status: 'completed',
                progress: 100,
                message: 'WPR generated successfully',
                files: [],
                recordCount: 0
              })
            }
          } else {
            // Error
            jobStatuses.set(jobId, {
              status: 'failed',
              progress: 0,
              message: `WPR generation failed: ${errorData || 'Unknown error'}`,
              error: errorData,
              completedAt: new Date().toISOString()
            })
          }
        })

        return NextResponse.json({
          jobId,
          mode: 'real',
          message: 'WPR generation started successfully'
        })

      } catch (error) {
        console.error('Failed to start WPR Python process:', error)
        pythonAvailable = false
      }
    }

    if (!pythonAvailable) {
      // Demo mode - simulate processing and create demo files
      console.log('Running WPR generation in demo mode')
      
      setTimeout(() => {
        jobStatuses.set(jobId, {
          status: 'processing',
          progress: 30,
          message: 'Demo: Collecting solar project data...'
        })
      }, 2000)
      
      setTimeout(() => {
        jobStatuses.set(jobId, {
          status: 'processing',
          progress: 60,
          message: 'Demo: Calculating performance metrics...'
        })
      }, 5000)
      
      setTimeout(async () => {
        // Create demo WPR file
        const downloadsDir = path.join(process.cwd(), 'downloads', 'wpr')
        await fs.mkdir(downloadsDir, { recursive: true })
        
        const currentDate = new Date()
        const weekNumber = getWeekNumber(currentDate)
        const demoFileName = `WPR_${currentDate.getFullYear()}_Week_${weekNumber.toString().padStart(2, '0')}.csv`
        
        // Generate demo WPR CSV content
        const demoContent = generateDemoWPRContent()
        
        await fs.writeFile(path.join(downloadsDir, demoFileName), demoContent)
        
        jobStatuses.set(jobId, {
          status: 'completed',
          progress: 100,
          message: 'Demo: WPR generated successfully',
          files: [{
            fileName: demoFileName,
            size: demoContent.length,
            created: new Date().toISOString(),
            downloadUrl: `/api/wpr/download?fileName=${demoFileName}`
          }],
          recordCount: 50,
          completedAt: new Date().toISOString()
        })
      }, 8000)

      return NextResponse.json({
        jobId,
        mode: 'demo',
        message: 'Demo mode: Simulating WPR generation'
      })
    }

  } catch (error) {
    console.error('WPR API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during WPR generation' },
      { status: 500 }
    )
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// Generate demo WPR CSV content
function generateDemoWPRContent(): string {
  const headers = [
    'Date',
    'Project',
    'Site_ID',
    'Energy_Production_kWh',
    'Performance_Ratio_%',
    'Availability_%',
    'Maintenance_Events',
    'Weather_Conditions',
    'Notes'
  ].join(',')

  const rows = [headers]
  const currentDate = new Date()
  const projects = [
    { name: 'Solar Farm Alpha', siteId: 'SFA-001' },
    { name: 'Solar Farm Beta', siteId: 'SFB-002' },
    { name: 'Rooftop Installation C', siteId: 'RIC-003' }
  ]

  // Generate data for the past 7 days
  for (let day = 6; day >= 0; day--) {
    const date = new Date(currentDate)
    date.setDate(date.getDate() - day)
    const dateStr = date.toISOString().split('T')[0]

    projects.forEach(project => {
      const energyProduction = (Math.random() * 5000 + 3000).toFixed(1)
      const performanceRatio = (85 + Math.random() * 10).toFixed(1)
      const availability = (95 + Math.random() * 5).toFixed(1)
      const maintenanceEvents = Math.random() > 0.7 ? 'Panel cleaning' : 'None'
      const weather = ['Sunny', 'Partly cloudy', 'Overcast', 'Clear'][Math.floor(Math.random() * 4)]
      const notes = Math.random() > 0.8 ? 'System performing optimally' : ''

      rows.push([
        dateStr,
        project.name,
        project.siteId,
        energyProduction,
        performanceRatio,
        availability,
        maintenanceEvents,
        weather,
        notes
      ].join(','))
    })
  }

  return rows.join('\\n')
}

// Export job statuses for status endpoint
export { jobStatuses }