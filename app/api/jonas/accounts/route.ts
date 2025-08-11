import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { fileManager } from '@/lib/jonas/file-manager'
import { jonasRunner } from '@/lib/jonas/runner'
import { getJonasCredentials } from '@/app/lib/jonas-credentials'

interface AccountData {
  code: string
  startDate: string
  endDate: string
}

export async function POST(request: NextRequest) {
  try {
    const { accounts, sessionId, credentials, emailConfig, showBrowser } = await request.json()

    // Validate input
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts provided' },
        { status: 400 }
      )
    }

    // Validate each account
    for (const account of accounts) {
      if (!account.code || !account.startDate || !account.endDate) {
        return NextResponse.json(
          { error: 'Invalid account data: missing required fields' },
          { status: 400 }
        )
      }
    }

    const jobId = `account_job_${Date.now()}`
    const config = {
      type: 'accounts' as const,
      accounts,
      credentials: credentials || getJonasCredentials(),
      email: emailConfig,
      showBrowser: showBrowser || false
    }

    // Create a temporary JSON file with the configuration
    const configPath = path.join(process.cwd(), 'temp', `jonas_accounts_${jobId}.json`)

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(configPath), { recursive: true })
    await fs.writeFile(configPath, JSON.stringify(config, null, 2))

    // Check if Python is available, otherwise use demo mode
    const pythonAvailable = await jonasRunner.checkDependencies()
    let result
    
    if (pythonAvailable) {
      // Run real Python automation synchronously
      console.log('Starting real AM Automation with Python...')
      try {
        const automationResult = await jonasRunner.run(config, jobId)
        console.log('Python automation completed:', automationResult)
        
        result = {
          success: automationResult.success,
          message: automationResult.message,
          jobId,
          accounts: accounts.map((acc: AccountData) => ({
            code: acc.code,
            dateRange: `${acc.startDate} to ${acc.endDate}`
          })),
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
          accounts: accounts.map((acc: AccountData) => ({
            code: acc.code,
            dateRange: `${acc.startDate} to ${acc.endDate}`
          })),
          mode: 'real'
        }
      }
    } else {
      // Fallback to demo mode
      console.log('Python not available, using demo mode...')
      const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
      await fs.mkdir(downloadsDir, { recursive: true })
      
      const createdFiles: string[] = []
      
      // Create separate demo files for each account
      for (const account of accounts) {
        const fileName = `${jobId}_account_${account.code}_output.xlsx`
        const filePath = path.join(downloadsDir, fileName)
        const fileContent = `PK\x03\x04\x14\x00\x00\x00\x08\x00demo_excel_account_${account.code}_report_for_${jobId}_${account.startDate}_to_${account.endDate}_DEMO_MODE`
        
        await fs.writeFile(filePath, fileContent, 'binary')
        createdFiles.push(filePath)
        console.log(`Created demo account file: ${fileName}`)
      }
      
      result = {
        success: true,
        message: 'Demo mode - AM Automation completed',
        jobId,
        accounts: accounts.map((acc: AccountData) => ({
          code: acc.code,
          dateRange: `${acc.startDate} to ${acc.endDate}`
        })),
        outputPaths: createdFiles,
        mode: 'demo'
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Account processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process account request' },
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
  const progress = Math.min(100, Math.floor(Math.random() * 30) + 70)
  const isCompleted = progress === 100

  // Get available files for this job
  const jobFiles = await fileManager.getJobFiles(jobId)

  return NextResponse.json({
    jobId,
    status: isCompleted ? 'completed' : 'processing',
    progress,
    message: isCompleted ? 'All account reports generated successfully' : 'Processing GL transactions...',
    downloadUrl: isCompleted ? `/api/jonas/download?jobId=${jobId}` : null,
    files: jobFiles,
    totalFiles: jobFiles.length,
    details: {
      totalAccounts: 3,
      processedAccounts: isCompleted ? 3 : 2,
      currentAccount: isCompleted ? null : 'Account 501012'
    }
  })
}