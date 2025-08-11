import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fileName = searchParams.get('fileName') || searchParams.get('file')
    const fileType = searchParams.get('type')
    const siteId = searchParams.get('site')
    const jobId = searchParams.get('jobId')

    if (!fileName && !jobId) {
      return NextResponse.json(
        { error: 'File name or Job ID required' },
        { status: 400 }
      )
    }

    let filePath = ''
    let actualFileName = fileName || 'data.csv'

    if (fileType === 'demo') {
      // Return demo CSV data
      const demoData = generateDemoCSV(actualFileName)
      
      return new NextResponse(demoData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${actualFileName}"`,
          'Content-Length': demoData.length.toString()
        }
      })
    }

    if (fileType === 'locus') {
      // Look for Locus files in automation_scripts directory
      const locusDir = path.join(process.cwd(), 'automation_scripts')
      filePath = path.join(locusDir, actualFileName)
    } else if (fileType === 'powertrack') {
      // Look for PowerTrack files in downloads directory (similar to Jonas)
      const powerTrackDir = path.join(process.cwd(), 'downloads', 'amos', 'powertrack')
      filePath = path.join(powerTrackDir, actualFileName)
    } else if (siteId) {
      // Fallback: Look for PowerTrack files in app/services/data/{siteId} directory
      const powerTrackDir = path.join(process.cwd(), 'app', 'services', 'data', siteId)
      filePath = path.join(powerTrackDir, actualFileName)
    } else {
      // Default path based on file type
      const defaultDir = path.join(process.cwd(), 'automation_scripts')
      filePath = path.join(defaultDir, actualFileName)
    }

    // Check if file exists
    try {
      await fs.access(filePath)
      
      // Get file stats
      const stats = await fs.stat(filePath)
      const fileContent = await fs.readFile(filePath)
      
      // Determine content type
      const contentType = actualFileName.endsWith('.csv') ? 'text/csv' : 
                         actualFileName.endsWith('.json') ? 'application/json' :
                         'application/octet-stream'

      return new NextResponse(fileContent, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${actualFileName}"`,
          'Content-Length': stats.size.toString(),
          'Last-Modified': stats.mtime.toUTCString()
        }
      })

    } catch (error) {
      console.log(`File not found: ${filePath}, generating demo data`)
      
      // If file doesn't exist, generate demo data
      const demoData = generateDemoCSV(actualFileName)
      
      return new NextResponse(demoData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${actualFileName}"`,
          'Content-Length': demoData.length.toString()
        }
      })
    }

  } catch (error) {
    console.error('AMOS download error:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

function generateDemoCSV(fileName: string): string {
  const timestamp = new Date().toISOString()
  
  if (fileName.includes('locus') || fileName.includes('energy')) {
    // Generate Locus Energy demo data
    const headers = 'Site Time,Inverter 1 (kWh),Inverter 2 (kWh),Inverter 3 (kWh),POA Irradiance (W/m²),site_name,date_range_start,date_range_end'
    const rows: string[] = [headers]
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(Date.now() - (i * 15 * 60 * 1000)) // 15-minute intervals
      const inv1 = (Math.random() * 50 + 10).toFixed(2)
      const inv2 = (Math.random() * 50 + 10).toFixed(2) 
      const inv3 = (Math.random() * 50 + 10).toFixed(2)
      const poa = (Math.random() * 800 + 200).toFixed(1)
      
      rows.push(`${date.toISOString().replace('T', ' ').replace('Z', '')},${inv1},${inv2},${inv3},${poa},USG1,2024-01-01,2024-12-31`)
    }
    
    return rows.join('\n')
  }
  
  if (fileName.includes('meter')) {
    // Generate PowerTrack meter data
    const headers = 'timestamp,component_id,energy,name,asset_id,id,created_at'
    const rows: string[] = [headers]
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - (i * 15 * 60 * 1000))
      const energy = (Math.random() * 100 + 50).toFixed(2)
      const id = `meter_${i + 1}`
      
      rows.push(`${timestamp.toISOString()},Meter 1,${energy},Main Meter,42541,${id},${timestamp.toISOString()}`)
    }
    
    return rows.join('\n')
  }
  
  if (fileName.includes('inverter')) {
    // Generate PowerTrack inverter data
    const headers = 'timestamp,component_id,energy,name,asset_id,id,created_at'
    const rows: string[] = [headers]
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - (i * 15 * 60 * 1000))
      const energy = (Math.random() * 75 + 25).toFixed(2)
      const invNum = (i % 10) + 1
      const id = `inv_${i + 1}`
      
      rows.push(`${timestamp.toISOString()},Inverter ${invNum},${energy},Inverter ${invNum},42541,${id},${timestamp.toISOString()}`)
    }
    
    return rows.join('\n')
  }
  
  if (fileName.includes('weather')) {
    // Generate PowerTrack weather data
    const headers = 'timestamp,component_id,insolation,name,asset_id,id,created_at'
    const rows: string[] = [headers]
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - (i * 15 * 60 * 1000))
      const insolation = (Math.random() * 0.8 + 0.2).toFixed(3) // Divided by 4000 as per PowerTrack config
      const id = `weather_${i + 1}`
      
      rows.push(`${timestamp.toISOString()},POA Sensor 1,${insolation},Weather Station 1,42541,${id},${timestamp.toISOString()}`)
    }
    
    return rows.join('\n')
  }
  
  // Default generic CSV
  const headers = 'timestamp,value,description'
  const rows: string[] = [headers]
  
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - (i * 60 * 1000))
    const value = (Math.random() * 100).toFixed(2)
    
    rows.push(`${timestamp.toISOString()},${value},Demo data point ${i + 1}`)
  }
  
  return rows.join('\n')
}