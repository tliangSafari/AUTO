import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import { fileManager } from '@/lib/jonas/file-manager'
import { jonasRunner } from '@/lib/jonas/runner'
import { getJonasCredentials } from '@/app/lib/jonas-credentials'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`\n[${new Date().toISOString()}] AM Automation vendors API called`)
  
  try {
    console.log(`[${new Date().toISOString()}] Parsing request body...`)
    const requestBody = await request.json()
    const { vendors, sessionId, credentials, emailConfig, showBrowser } = requestBody
    
    console.log(`[${new Date().toISOString()}] Request parsed (${Date.now() - startTime}ms)`)
    console.log("Vendors received:", Array.isArray(vendors) ? `Array with ${vendors.length} items` : vendors)
    if (Array.isArray(vendors)) {
      console.log("Vendor list:")
      vendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. "${vendor}"`)
      })
    }
    console.log("Email config:", emailConfig?.recipient ? `Email to ${emailConfig.recipient}` : "No email")
    console.log("Show browser:", showBrowser)

    // Validate input
    if (!vendors || !Array.isArray(vendors) || vendors.length === 0) {
      return NextResponse.json(
        { error: 'No vendors provided' },
        { status: 400 }
      )
    }

    const jobId = `vendor_job_${Date.now()}`
    const config = {
      type: 'vendors' as const,
      vendors,
      credentials: credentials || getJonasCredentials(),
      email: emailConfig,
      showBrowser: showBrowser || false
    }

    // Check if Python is available, otherwise use demo mode
    console.log(`[${new Date().toISOString()}] Checking Python dependencies... (${Date.now() - startTime}ms)`)
    const pythonAvailable = await jonasRunner.checkDependencies()
    console.log(`[${new Date().toISOString()}] Python check complete: ${pythonAvailable ? 'Available' : 'Not available'} (${Date.now() - startTime}ms)`)
    let result
    
    if (pythonAvailable) {
      // Run real Python automation synchronously
      console.log(`[${new Date().toISOString()}] Starting real AM Automation with Python... (${Date.now() - startTime}ms)`)
      try {
        const automationResult = await jonasRunner.run(config, jobId)
        console.log('Python automation completed:', automationResult)
        
        result = {
          success: automationResult.success,
          message: automationResult.message,
          jobId,
          vendors: vendors,
          outputPaths: automationResult.outputPaths,
          mode: 'real'
        }
      } catch (error) {
        console.error('Python automation failed:', error)
        result = {
          success: false,
          message: 'AM Automation failed',
          error: error.error || error.message,
          jobId,
          vendors: vendors,
          mode: 'real'
        }
      }
    } else {
      // Fallback to demo mode
      console.log('Python not available, using demo mode...')
      const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
      await fs.mkdir(downloadsDir, { recursive: true })
      
      // Create HTML file for demo
      const htmlFileName = `${jobId}_vendor_output.html`
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Demo Vendor Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { background-color: #4CAF50; color: white; padding: 10px; }
        .demo-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="demo-notice">
        <strong>Demo Mode:</strong> Python environment not available. This is a simulated report.
    </div>
    <div class="header">
        <h1>AM Automation - Vendor Report (Demo)</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Job ID: ${jobId}</p>
    </div>
    
    <h2>Vendor Summary</h2>
    <p>Total vendors processed: ${vendors.length}</p>
    <ul>
        ${vendors.map(vendor => `<li>${vendor}</li>`).join('')}
    </ul>
    
    <h2>Report Data (Simulated)</h2>
    <table>
        <tr>
            <th>Vendor Name</th>
            <th>Pending Invoices</th>
            <th>Total Amount</th>
            <th>Status</th>
        </tr>
        ${vendors.map(vendor => `
        <tr>
            <td>${vendor}</td>
            <td>${Math.floor(Math.random() * 5) + 1}</td>
            <td>$${(Math.random() * 10000 + 1000).toFixed(2)}</td>
            <td>Demo Data</td>
        </tr>
        `).join('')}
    </table>
    
    <p><em>This is demo data. Install Python and Playwright dependencies for real AM Automation.</em></p>
</body>
</html>`
      
      await fs.writeFile(path.join(downloadsDir, htmlFileName), htmlContent, 'utf-8')
      console.log(`Created demo HTML file: ${htmlFileName}`)
      
      result = {
        success: true,
        message: 'Demo mode - AM Automation completed',
        jobId,
        vendors: vendors,
        outputPaths: [path.join(downloadsDir, htmlFileName)],
        mode: 'demo'
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vendor processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process vendor request' },
      { status: 500 }
    )
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID required' },
      { status: 400 }
    )
  }

  // In a real implementation, check the actual job status
  // For demo, return mock status
  const mockStatuses = ['pending', 'processing', 'completed', 'failed']
  const randomStatus = mockStatuses[Math.floor(Math.random() * 2) + 1] // Only processing or completed for demo

  // Get available files for this job
  const jobFiles = await fileManager.getJobFiles(jobId)

  return NextResponse.json({
    jobId,
    status: randomStatus,
    progress: randomStatus === 'completed' ? 100 : 50,
    message: randomStatus === 'completed' ? 'Report generated successfully' : 'Processing vendors...',
    downloadUrl: randomStatus === 'completed' ? `/api/jonas/download?jobId=${jobId}` : null,
    files: jobFiles,
    totalFiles: jobFiles.length
  })
}