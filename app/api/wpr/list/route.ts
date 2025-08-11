import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest) {
  try {
    const downloadsDir = path.join(process.cwd(), 'downloads', 'wpr')
    let reports: any[] = []

    try {
      // Check if downloads directory exists
      await fs.access(downloadsDir)
      
      // Read all WPR files
      const files = await fs.readdir(downloadsDir)
      const wprFiles = files.filter(f => f.endsWith('.csv') && f.toLowerCase().includes('wpr'))
      
      // Get file stats and create report objects
      reports = await Promise.all(wprFiles.map(async (fileName) => {
        const filePath = path.join(downloadsDir, fileName)
        const stats = await fs.stat(filePath)
        
        // Extract week info from filename (e.g., WPR_2024_Week_03.csv)
        const weekMatch = fileName.match(/WPR_(\d{4})_Week_(\d+)/)
        const year = weekMatch ? weekMatch[1] : new Date().getFullYear().toString()
        const weekNum = weekMatch ? weekMatch[2] : '1'
        
        return {
          id: fileName.replace(/[^a-zA-Z0-9]/g, '_'),
          filename: fileName,
          week: getWeekDateRange(parseInt(year), parseInt(weekNum)),
          generated: stats.birthtime.toISOString(),
          size: formatFileSize(stats.size),
          projects: 3, // Default number of projects
          downloadUrl: `/api/wpr/download?fileName=${fileName}`
        }
      }))
      
      // Sort by generation date (newest first)
      reports.sort((a, b) => new Date(b.generated).getTime() - new Date(a.generated).getTime())
      
    } catch (error) {
      console.log('WPR downloads directory not found or empty')
      // Return empty array if no files exist yet
    }

    return NextResponse.json({
      reports,
      totalReports: reports.length
    })

  } catch (error) {
    console.error('WPR list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get week date range from year and week number
function getWeekDateRange(year: number, weekNumber: number): string {
  const firstDayOfYear = new Date(year, 0, 1)
  const firstMonday = new Date(firstDayOfYear)
  
  // Find the first Monday of the year
  const daysToAdd = (8 - firstDayOfYear.getDay()) % 7
  firstMonday.setDate(firstDayOfYear.getDate() + daysToAdd)
  
  // Calculate the start of the requested week
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7)
  
  // Calculate the end of the week (Sunday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  }
  
  const startStr = weekStart.toLocaleDateString('en-US', formatOptions)
  const endStr = weekEnd.toLocaleDateString('en-US', { 
    ...formatOptions, 
    year: 'numeric' 
  })
  
  return `${startStr}-${endStr}`
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}