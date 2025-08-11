import { NextRequest, NextResponse } from 'next/server'
import { fileManager } from '@/lib/jonas/file-manager'

// This would typically connect to a job queue or database
// For demo purposes, we'll use in-memory storage
const jobStatuses = new Map()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID required' },
      { status: 400 }
    )
  }

  // In a real implementation, this would query a database or job queue
  // For demo, generate dynamic status updates
  const baseTime = parseInt(jobId.split('_').pop() || '0')
  const elapsed = Date.now() - baseTime
  const progress = Math.min(100, Math.floor(elapsed / 1000) * 10)

  const statusMessages = [
    { progress: 0, message: 'Initializing AM Automation connection...' },
    { progress: 10, message: 'Logging in to AM Automation...' },
    { progress: 25, message: 'Login successful, navigating to reports...' },
    { progress: 40, message: 'Configuring report parameters...' },
    { progress: 60, message: 'Querying data from AM Automation...' },
    { progress: 80, message: 'Processing report data...' },
    { progress: 95, message: 'Finalizing report...' },
    { progress: 100, message: 'Report completed successfully!' }
  ]

  const currentStatus = statusMessages.reverse().find(s => progress >= s.progress) || statusMessages[0]

  // Get available files for this job
  const jobFiles = await fileManager.getJobFiles(jobId)

  return NextResponse.json({
    jobId,
    status: progress === 100 ? 'completed' : 'processing',
    progress,
    message: currentStatus.message,
    details: {
      startTime: new Date(baseTime).toISOString(),
      elapsed: Math.floor(elapsed / 1000),
      estimatedRemaining: progress < 100 ? Math.max(1, Math.floor((100 - progress) / 10)) : 0
    },
    downloadUrl: progress === 100 ? `/api/jonas/download?jobId=${jobId}` : null,
    files: jobFiles,
    totalFiles: jobFiles.length
  })
}

// Server-Sent Events endpoint for real-time updates
export async function POST(request: NextRequest) {
  const { jobId } = await request.json()

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID required' },
      { status: 400 }
    )
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Send updates every 2 seconds
      const interval = setInterval(() => {
        const baseTime = parseInt(jobId.split('_').pop() || '0')
        const elapsed = Date.now() - baseTime
        const progress = Math.min(100, Math.floor(elapsed / 1000) * 5)

        const data = {
          jobId,
          progress,
          status: progress === 100 ? 'completed' : 'processing',
          message: `Processing... ${progress}%`
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

        if (progress === 100) {
          clearInterval(interval)
          controller.close()
        }
      }, 2000)

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, { headers })
}