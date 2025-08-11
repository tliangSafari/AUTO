import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name required' },
        { status: 400 }
      )
    }

    // Define the downloads directory
    const downloadsDir = path.join(process.cwd(), 'downloads', 'jonas')
    const filePath = path.join(downloadsDir, fileName)

    // Check if file exists and is HTML
    try {
      await fs.access(filePath)
      const ext = path.extname(filePath).toLowerCase()
      
      if (ext !== '.html') {
        return NextResponse.json(
          { error: 'Only HTML files can be previewed' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read and return HTML content
    const htmlContent = await fs.readFile(filePath, 'utf-8')
    
    // Return HTML content with proper headers
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}