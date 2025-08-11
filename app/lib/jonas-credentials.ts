import fs from 'fs'
import path from 'path'

export interface JonasCredentials {
  clientId: string
  username: string
  password: string
}

/**
 * Read Jonas credentials from the centralized config file
 * Falls back to hardcoded defaults if file is not found
 */
export function getJonasCredentials(): JonasCredentials {
  try {
    // Path to the centralized credentials file
    const credentialsPath = path.join(
      process.cwd(), 
      'automation_scripts', 
      'jonas', 
      'jonas_credentials.json'
    )
    
    const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8')
    const credentials = JSON.parse(credentialsContent)
    
    return {
      clientId: credentials.clientId || '121297',
      username: credentials.username || 'SLiu',
      password: credentials.password || 'AspenPower123-'
    }
  } catch (error) {
    console.warn('Could not read centralized Jonas credentials, using fallback defaults:', error.message)
    
    // Fallback to defaults if file doesn't exist or can't be read
    return {
      clientId: '121297',
      username: 'SLiu',
      password: 'AspenPower123-'
    }
  }
}