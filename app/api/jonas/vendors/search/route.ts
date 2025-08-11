import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { vendorName } = await request.json()
    
    if (!vendorName || typeof vendorName !== 'string') {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })
    }

    // Call Python script to search for vendor in AM Automation
    const found = await searchVendorInJonas(vendorName.trim())
    
    return NextResponse.json({ 
      found,
      vendorName: vendorName.trim(),
      message: found 
        ? `Vendor "${vendorName}" found in AM Automation` 
        : `Vendor "${vendorName}" not found in AM Automation`
    })
    
  } catch (error) {
    console.error('Vendor search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search vendor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function searchVendorInJonas(vendorName: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const pythonScript = path.join(process.cwd(), 'playwright', 'jonas', 'vendor_search.py')
      
      const pythonProcess = spawn('python', [pythonScript, vendorName], {
        cwd: process.cwd()
      })

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        console.log(`Vendor search process exited with code ${code}`)
        
        if (code === 0) {
          // Parse the output to determine if vendor was found
          const result = output.trim().toLowerCase()
          const found = result.includes('found') || result.includes('true')
          resolve(found)
        } else {
          console.error('Vendor search error:', errorOutput)
          // For now, return false if there's an error
          // In production, you might want to throw an error or return a different status
          resolve(false)
        }
      })

      pythonProcess.on('error', (error) => {
        console.error('Failed to start vendor search process:', error)
        resolve(false)
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        pythonProcess.kill()
        console.error('Vendor search timed out')
        resolve(false)
      }, 30000)
      
    } catch (error) {
      console.error('Vendor search function error:', error)
      resolve(false)
    }
  })
}