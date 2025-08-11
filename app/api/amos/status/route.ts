import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus, setJobStatus, hasJob } from '../job-store'

// This would typically query a database or Redis in production
// For demo purposes, we'll check both Locus and PowerTrack job stores
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID required' },
      { status: 400 }
    )
  }

  // Try to get job status from our map or create a default one
  let jobStatus = getJobStatus(jobId)
  console.log(`[Status] Looking for job ${jobId}, found:`, jobStatus ? 'yes' : 'no')
  
  if (!jobStatus) {
    // If not found, try to determine platform from jobId and create default status
    const isLocus = jobId.includes('locus')
    const isPowerTrack = jobId.includes('powertrack')
    console.log(`[Status] Job ${jobId} not found, creating demo status for ${isLocus ? 'Locus' : isPowerTrack ? 'PowerTrack' : 'Unknown'}`)
    
    if (isLocus || isPowerTrack) {
      // Generate dynamic status based on elapsed time (for demo)
      const baseTime = parseInt(jobId.split('_').pop() || '0')
      const elapsed = Date.now() - baseTime
      const progress = Math.min(100, Math.floor(elapsed / 1000) * 8) // 8% per second
      
      const platform = isLocus ? 'Locus Energy' : 'PowerTrack'
      const statusMessages = [
        { progress: 0, message: `Initializing ${platform} automation...` },
        { progress: 10, message: `Starting ${platform} connection...` },
        { progress: 25, message: `Logging in to ${platform}...` },
        { progress: 40, message: `Configuring data extraction parameters...` },
        { progress: 60, message: `Downloading monitoring data...` },
        { progress: 80, message: `Processing data files...` },
        { progress: 95, message: `Finalizing data extraction...` },
        { progress: 100, message: `${platform} data extraction completed successfully!` }
      ]

      const currentStatus = statusMessages.reverse().find(s => progress >= s.progress) || statusMessages[0]
      
      jobStatus = {
        status: progress === 100 ? 'completed' : 'processing',
        progress,
        message: currentStatus.message,
        startTime: new Date(baseTime).toISOString(),
        files: progress === 100 ? generateDemoFiles(platform.toLowerCase().replace(' ', ''), jobId) : [],
        recordCount: progress === 100 ? (isLocus ? 2000 : 5000) : 0
      }
      
      // Cache the status
      setJobStatus(jobId, jobStatus)
    } else {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }
  }

  return NextResponse.json({
    jobId,
    status: jobStatus.status,
    progress: jobStatus.progress,
    message: jobStatus.message,
    details: {
      startTime: jobStatus.startTime,
      elapsed: jobStatus.startTime ? Math.floor((Date.now() - new Date(jobStatus.startTime).getTime()) / 1000) : 0,
      estimatedRemaining: jobStatus.progress < 100 ? Math.max(1, Math.floor((100 - jobStatus.progress) / 8)) : 0
    },
    downloadUrl: jobStatus.status === 'completed' ? `/api/amos/download?jobId=${jobId}` : null,
    files: jobStatus.files || [],
    recordCount: jobStatus.recordCount || 0,
    totalFiles: (jobStatus.files || []).length,
    error: jobStatus.error
  })
}

function generateDemoFiles(platform: string, jobId: string) {
  const timestamp = new Date().toISOString()
  
  if (platform === 'locus') {
    return [{
      fileName: `locus_energy_data_${Date.now()}.csv`,
      size: Math.floor(Math.random() * 30000) + 15000,
      created: timestamp,
      downloadUrl: `/api/amos/download?file=locus_energy_data_${Date.now()}.csv&type=demo`
    }]
  } else if (platform === 'powertrack') {
    return [
      {
        fileName: `meter_data_${Date.now()}.csv`,
        size: Math.floor(Math.random() * 25000) + 20000,
        created: timestamp,
        downloadUrl: `/api/amos/download?file=meter_data_${Date.now()}.csv&type=demo`
      },
      {
        fileName: `inverter_data_${Date.now()}.csv`,
        size: Math.floor(Math.random() * 18000) + 12000,
        created: timestamp,
        downloadUrl: `/api/amos/download?file=inverter_data_${Date.now()}.csv&type=demo`
      },
      {
        fileName: `weather_station_data_${Date.now()}.csv`,
        size: Math.floor(Math.random() * 10000) + 8000,
        created: timestamp,
        downloadUrl: `/api/amos/download?file=weather_station_data_${Date.now()}.csv&type=demo`
      }
    ]
  }
  
  return []
}

