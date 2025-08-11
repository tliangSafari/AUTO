import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')
    const fileName = searchParams.get('fileName')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    // Define the downloads directory
    const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
    
    let filePath: string

    if (fileName) {
      // Direct file download
      filePath = path.join(downloadsDir, fileName)
    } else {
      // Find file by jobId
      try {
        const files = await fs.readdir(downloadsDir)
        const matchingFile = files.find(file => file.includes(jobId.replace(/[^a-zA-Z0-9]/g, '_')))
        
        if (!matchingFile) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          )
        }
        
        filePath = path.join(downloadsDir, matchingFile)
      } catch (error) {
        return NextResponse.json(
          { error: 'Download directory not found' },
          { status: 404 }
        )
      }
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = await fs.stat(filePath)
    const fileBuffer = await fs.readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (ext === '.xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (ext === '.xls') {
      contentType = 'application/vnd.ms-excel'
    } else if (ext === '.csv') {
      contentType = 'text/csv'
    } else if (ext === '.html') {
      contentType = 'text/html'
    }

    const fileName_safe = path.basename(filePath)

    // Create response with proper headers for file download
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', contentType)
    response.headers.set('Content-Disposition', `attachment; filename="${fileName_safe}"`)
    response.headers.set('Content-Length', stats.size.toString())
    response.headers.set('Cache-Control', 'no-cache')

    return response

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available files for a job
export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
    
    try {
      const files = await fs.readdir(downloadsDir)
      const jobFiles = []
      
      for (const file of files) {
        if (file.includes(jobId.replace(/[^a-zA-Z0-9]/g, '_'))) {
          const filePath = path.join(downloadsDir, file)
          const stats = await fs.stat(filePath)
          
          jobFiles.push({
            fileName: file,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            downloadUrl: `/api/jonas/download?jobId=${jobId}&fileName=${encodeURIComponent(file)}`
          })
        }
      }

      return NextResponse.json({
        jobId,
        files: jobFiles,
        totalFiles: jobFiles.length
      })

    } catch (error) {
      return NextResponse.json({
        jobId,
        files: [],
        totalFiles: 0,
        message: 'No files found'
      })
    }

  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}