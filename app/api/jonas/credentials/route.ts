import { NextRequest, NextResponse } from 'next/server'
import { getJonasCredentials } from '@/app/lib/jonas-credentials'

export async function GET(request: NextRequest) {
  try {
    // Get credentials from centralized config
    const credentials = getJonasCredentials()
    
    return NextResponse.json({
      success: true,
      credentials: {
        clientId: credentials.clientId,
        username: credentials.username,
        password: credentials.password
      }
    })
  } catch (error) {
    console.error('Error fetching AM Automation credentials:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load credentials',
        // Provide fallback credentials in case of error
        credentials: {
          clientId: '121297',
          username: 'SLiu',
          password: 'AspenPower123-'
        }
      },
      { status: 500 }
    )
  }
}