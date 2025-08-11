"use client"

import { useState, useEffect } from "react"
import type { Target, ExtractionResult, JonasCredentials } from "@/app/types"
import JonasModeSelector from "./jonas-mode-selector"
import JonasTabbedConfig from "./jonas-tabbed-config"
import ProcessingView from "../shared/processing-view"
import ResultsView from "../shared/results-view"
import { extractJonasData } from "@/app/lib/jonas-api"
import JonasAutomaticDashboard from "./jonas-automatic-dashboard"

interface JonasFlowProps {
  selectedTarget: Target
  isExtracting: boolean
  setIsExtracting: (value: boolean) => void
  progress: number
  setProgress: (value: number) => void
  results: ExtractionResult[]
  setResults: (value: ExtractionResult[]) => void
  currentStep: string
  setCurrentStep: (value: string) => void
  onBack: () => void
}

export default function JonasFlow({
  selectedTarget,
  isExtracting,
  setIsExtracting,
  progress,
  setProgress,
  results,
  setResults,
  currentStep,
  setCurrentStep,
  onBack
}: JonasFlowProps) {
  const [jonasStep, setJonasStep] = useState<"mode" | "config" | "processing" | "results" | "dashboard">("mode")
  const [jonasMode, setJonasMode] = useState<"selection" | "manual" | "automatic">("selection")
  const [jonasCredentials, setJonasCredentials] = useState<JonasCredentials | null>(null)
  const [jonasDataType, setJonasDataType] = useState<"vendors" | "accounts" | null>(null)
  const [jonasConfig, setJonasConfig] = useState<any>(null)
  const [defaultCredentials, setDefaultCredentials] = useState<JonasCredentials | null>(null)
  const [credentialsLoading, setCredentialsLoading] = useState(true)

  // Fetch default credentials from API on component mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch('/api/jonas/credentials')
        const data = await response.json()
        
        if (data.success && data.credentials) {
          setDefaultCredentials(data.credentials)
        } else {
          // Fallback credentials if API fails
          setDefaultCredentials({
            clientId: "121297",
            username: "SLiu",
            password: "AspenPower123-"
          })
        }
      } catch (error) {
        console.error('Failed to fetch Jonas credentials:', error)
        // Fallback credentials if fetch fails
        setDefaultCredentials({
          clientId: "121297",
          username: "SLiu",
          password: "AspenPower123-"
        })
      } finally {
        setCredentialsLoading(false)
      }
    }

    fetchCredentials()
  }, [])

  const handleBack = () => {
    if (jonasStep !== "mode") {
      if (jonasStep === "config") setJonasStep("mode")
      else if (jonasStep === "results") setJonasStep("config")
      else if (jonasStep === "processing") setJonasStep("config")
      else if (jonasStep === "dashboard") setJonasStep("mode")
    } else {
      onBack()
    }
  }

  const handleJonasTabbedConfig = async (config: any, dataType: 'vendors' | 'accounts') => {
    console.log("🟠 JonasFlow - handleJonasTabbedConfig called")
    console.log("🟠 DataType:", dataType)
    console.log("🟠 Config received:", config)
    setJonasDataType(dataType)
    
    if (dataType === 'vendors') {
      // Handle vendor config (has email and sendEmail)
      console.log("🟠 Processing vendor config - vendors:", config.vendors)
      handleJonasConfig(config.vendors, config.email, config.sendEmail, dataType)
    } else {
      // Handle account config (direct config object)
      handleJonasConfig(config, "tliang@aspenpower.com", true, dataType)
    }
  }

  const handleJonasConfig = (config: any, email: string, sendEmail: boolean, dataType: 'vendors' | 'accounts') => {
    setJonasConfig(config)
    
    // Use fetched credentials or fallback
    const credentialsToUse = defaultCredentials || {
      clientId: "121297",
      username: "SLiu", 
      password: "AspenPower123-"
    }
    
    setJonasCredentials(credentialsToUse)
    handleJonasEmailSubmit(email, sendEmail, true, credentialsToUse, config, dataType)
  }

  const handleJonasEmailSubmit = async (
    email: string, 
    sendEmail: boolean, 
    showBrowser: boolean = true, 
    credentials?: JonasCredentials, 
    configData?: any,
    dataType?: 'vendors' | 'accounts'
  ) => {
    setJonasStep("processing")
    
    // Use provided credentials, or stored credentials, or fetched default credentials
    const credentialsToUse = credentials || jonasCredentials || defaultCredentials || {
      clientId: "121297",
      username: "SLiu", 
      password: "AspenPower123-"
    }
    
    await extractJonasData({
      jonasDataType: dataType || jonasDataType,
      jonasConfig: configData || jonasConfig,
      credentials: credentialsToUse,
      email,
      sendEmail,
      showBrowser,
      setIsExtracting,
      setProgress,
      setCurrentStep,
      setResults,
      onComplete: () => setJonasStep("results")
    })
  }

  const handleNewProcess = () => {
    setJonasStep("mode")
    setJonasMode("selection")
    setResults([])
    setProgress(0)
    setJonasCredentials(null)
    setJonasDataType(null)
    setJonasConfig(null)
  }

  // Show loading while credentials are being fetched
  if (credentialsLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading AM Automation credentials...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {jonasStep === "mode" && (
        <JonasModeSelector 
          onModeSelect={(mode) => {
            setJonasMode(mode)
            if (mode === "manual") {
              setJonasStep("config")
            } else if (mode === "automatic") {
              setJonasStep("dashboard")
            }
          }}
        />
      )}
      
      {jonasStep === "config" && jonasMode === "manual" && (
        <JonasTabbedConfig onSubmit={handleJonasTabbedConfig} isLoading={isExtracting} />
      )}
      
      {jonasStep === "processing" && jonasMode === "manual" && (
        <ProcessingView
          title="Processing AM Automation Report"
          description="Please wait while we generate your report"
          progress={progress}
          currentStep={currentStep}
          results={results}
        />
      )}
      
      {jonasStep === "results" && results.length > 0 && jonasMode === "manual" && (
        <ResultsView
          title="Processing Complete!"
          description="Your AM Automation report has been generated and is ready for download"
          results={results}
          reportType={jonasDataType}
          onNewProcess={handleNewProcess}
          onBackToTargets={onBack}
        />
      )}
      
      {jonasStep === "dashboard" && jonasMode === "automatic" && (
        <JonasAutomaticDashboard />
      )}
    </div>
  )
}