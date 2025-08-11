import type { ExtractionResult, JonasCredentials } from "@/app/types"

interface ExtractJonasDataParams {
  jonasDataType: "vendors" | "accounts" | null
  jonasConfig: any
  credentials: JonasCredentials
  email: string
  sendEmail: boolean
  showBrowser: boolean
  setIsExtracting: (value: boolean) => void
  setProgress: (value: number) => void
  setCurrentStep: (value: string) => void
  setResults: (value: ExtractionResult[]) => void
  onComplete: () => void
}

export async function extractJonasData({
  jonasDataType,
  jonasConfig,
  credentials,
  email,
  sendEmail,
  showBrowser,
  setIsExtracting,
  setProgress,
  setCurrentStep,
  setResults,
  onComplete
}: ExtractJonasDataParams) {
  setIsExtracting(true)
  setProgress(0)
  setCurrentStep(showBrowser ? "Initializing AM Automation (browser will be visible)..." : "Initializing AM Automation...")

  try {
    // First, login
    setCurrentStep("Authenticating with AM Automation...")
    
    const loginResponse = await fetch('/api/jonas/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!loginResponse.ok) {
      throw new Error('Login failed')
    }

    const { sessionId } = await loginResponse.json()
    setProgress(20)

    // Prepare the request based on data type
    const endpoint = jonasDataType === "vendors" ? '/api/jonas/vendors' : '/api/jonas/accounts'
    
    // Fallback for vendors if jonasConfig is null
    const defaultVendors = [
      "Also Energy",
      "SDB LLC",
      "Fantasy Landscaping LLC",
      "United Agrivoltaics North America",
      "JUUCE Energy"
    ]
    
    const actualConfigData = jonasConfig || (jonasDataType === "vendors" ? defaultVendors : [])
    
    const requestData = {
      [jonasDataType === "vendors" ? "vendors" : "accounts"]: actualConfigData,
      sessionId,
      credentials,
      emailConfig: { recipient: email, send: sendEmail },
      showBrowser
    }

    // Start the job
    setCurrentStep(`Starting ${jonasDataType} processing...`)

    const jobResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      throw new Error(`Failed to start job: ${jobResponse.status} ${jobResponse.statusText} - ${errorText}`)
    }

    const { jobId, mode } = await jobResponse.json()
    setProgress(30)
    
    if (mode === 'real') {
      setCurrentStep(`Real AM Automation started${showBrowser ? ' (browser visible)' : ''}...`)
    } else {
      setCurrentStep('Demo mode - simulating AM Automation (Python not available)...')
    }

    // Poll for status updates
    let completed = false
    while (!completed) {
      const statusResponse = await fetch(`/api/jonas/status?jobId=${jobId}`)
      const status = await statusResponse.json()

      setProgress(status.progress)
      setCurrentStep(status.message)

      if (status.status === 'completed') {
        completed = true
        const result: ExtractionResult = {
          dataType: jonasDataType === "vendors" ? "Vendor Report" : "Account Report",
          status: "success",
          count: jonasDataType === "vendors" ? (jonasConfig?.length || 0) : (jonasConfig?.length || 0) * 50,
          data: status.files?.length > 0 ? status.files.map((file: any, idx: number) => ({ 
            id: idx + 1, 
            type: jonasDataType, 
            fileName: file.fileName,
            size: file.size,
            created: file.created,
            email: sendEmail ? email : "Downloaded locally", 
            timestamp: new Date().toISOString(),
            downloadUrl: file.downloadUrl
          })) : [{ 
            id: 1, 
            type: jonasDataType, 
            email: sendEmail ? email : "Downloaded locally", 
            timestamp: new Date().toISOString(),
            downloadUrl: status.downloadUrl 
          }],
          message: sendEmail ? `Report sent to ${email}` : `Report downloaded successfully${status.files?.length ? ` (${status.files.length} files)` : ""}`
        }
        setResults([result])
        setTimeout(onComplete, 1000)
      } else if (status.status === 'failed') {
        throw new Error(status.message || 'Job failed')
      }

      // Wait before next poll
      if (!completed) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  } catch (error) {
    console.error('Jonas processing error:', error)
    const errorResult: ExtractionResult = {
      dataType: jonasDataType === "vendors" ? "Vendor Report" : "Account Report",
      status: "error",
      count: 0,
      data: [],
      message: error instanceof Error ? error.message : "Failed to generate report. Please try again."
    }
    setResults([errorResult])
  } finally {
    setIsExtracting(false)
  }
}