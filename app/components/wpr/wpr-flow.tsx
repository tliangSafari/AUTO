"use client"

import { useState, useEffect } from "react"
import type { Target, ExtractionResult, WPRReport } from "@/app/types"
import WprModeSelector from "./wpr-mode-selector"
import WprList from "./wpr-list"
import WprConfig from "./wpr-config"
import WprAutomaticDashboard from "./wpr-automatic-dashboard"
import ProcessingView from "../shared/processing-view"
import WprResults from "./wpr-results"
import { getCurrentWeekString } from "@/app/lib/utils"

interface WprFlowProps {
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

export default function WprFlow({
  isExtracting,
  setIsExtracting,
  progress,
  setProgress,
  results,
  setResults,
  currentStep,
  setCurrentStep,
  onBack
}: WprFlowProps) {
  const [wprStep, setWprStep] = useState<"mode" | "config" | "list" | "generating" | "results" | "dashboard">("mode")
  const [wprMode, setWprMode] = useState<"selection" | "manual" | "automatic">("selection")
  const [previousReports, setPreviousReports] = useState<WPRReport[]>([])
  const [wprJobId, setWprJobId] = useState<string | null>(null)
  const [wprConfig, setWprConfig] = useState<any>(null)

  useEffect(() => {
    if (wprStep === "list") {
      loadPreviousWPRReports()
    }
  }, [wprStep])

  const handleBack = () => {
    if (wprStep !== "mode") {
      if (wprStep === "config") setWprStep("mode")
      else if (wprStep === "list") setWprStep("config")
      else if (wprStep === "results") setWprStep("list")
      else if (wprStep === "generating") setWprStep("list")
      else if (wprStep === "dashboard") setWprStep("mode")
    } else {
      onBack()
    }
  }

  const loadPreviousWPRReports = async () => {
    try {
      const response = await fetch('/api/wpr/list')
      if (response.ok) {
        const data = await response.json()
        setPreviousReports(data.reports || [])
      }
    } catch (error) {
      // Use mock data for demo
      const mockReports: WPRReport[] = [
        {
          id: 1,
          filename: 'WPR_2024_Week_03.csv',
          week: 'Jan 15-21, 2024',
          generated: '2024-01-22T10:30:00Z',
          size: '125 KB',
          projects: 3,
          downloadUrl: '/api/wpr/download?file=WPR_2024_Week_03.csv'
        },
        {
          id: 2,
          filename: 'WPR_2024_Week_02.csv',
          week: 'Jan 8-14, 2024',
          generated: '2024-01-15T09:15:00Z',
          size: '118 KB',
          projects: 3,
          downloadUrl: '/api/wpr/download?file=WPR_2024_Week_02.csv'
        },
        {
          id: 3,
          filename: 'WPR_2024_Week_01.csv',
          week: 'Jan 1-7, 2024',
          generated: '2024-01-08T11:45:00Z',
          size: '132 KB',
          projects: 3,
          downloadUrl: '/api/wpr/download?file=WPR_2024_Week_01.csv'
        }
      ]
      setPreviousReports(mockReports)
    }
  }

  const handleWprConfig = (config: any) => {
    setWprConfig(config)
    generateNewWPR(config)
  }

  const generateNewWPR = async (config?: any) => {
    setWprStep("generating")
    setProgress(0)
    
    const configData = config || wprConfig || {
      reportType: 'current_week',
      includeCharts: true,
      includeMaintenance: true
    }
    
    try {
      const response = await fetch('/api/wpr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      })

      if (response.ok) {
        const data = await response.json()
        setWprJobId(data.jobId)
        pollWPRStatus(data.jobId)
      }
    } catch (error) {
      console.error('Failed to generate WPR:', error)
      simulateWPRGeneration()
    }
  }

  const simulateWPRGeneration = async () => {
    const steps = [
      { progress: 20, message: "Collecting solar project data..." },
      { progress: 40, message: "Calculating performance metrics..." },
      { progress: 60, message: "Analyzing maintenance activities..." },
      { progress: 80, message: "Generating charts and summaries..." },
      { progress: 100, message: "WPR generated successfully!" }
    ]

    for (let step of steps) {
      setProgress(step.progress)
      setCurrentStep(step.message)
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    const newReport: WPRReport = {
      id: previousReports.length + 1,
      filename: `WPR_${new Date().getFullYear()}_Week_Current.csv`,
      week: getCurrentWeekString(),
      generated: new Date().toISOString(),
      size: '142 KB',
      projects: 3,
      downloadUrl: `/api/wpr/download?file=WPR_${new Date().getFullYear()}_Week_Current.csv`
    }
    
    setPreviousReports(prev => [newReport, ...prev])
    setWprStep("results")
  }

  const pollWPRStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/wpr/status?jobId=${jobId}`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data.progress || 0)
          setCurrentStep(data.message || "Processing...")
          
          if (data.status === 'completed') {
            clearInterval(interval)
            setWprStep("results")
            loadPreviousWPRReports()
          } else if (data.status === 'failed') {
            clearInterval(interval)
            setWprStep("list")
          }
        }
      } catch (error) {
        console.error('Failed to poll WPR status:', error)
        clearInterval(interval)
      }
    }, 2000)
  }

  const handleNewProcess = () => {
    setWprStep("mode")
    setWprMode("selection")
    setProgress(0)
    setWprConfig(null)
    setWprJobId(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {wprStep === "mode" && (
        <WprModeSelector 
          onModeSelect={(mode) => {
            setWprMode(mode)
            if (mode === "manual") {
              setWprStep("config")
            } else if (mode === "automatic") {
              setWprStep("dashboard")
            }
          }}
        />
      )}

      {wprStep === "config" && wprMode === "manual" && (
        <WprConfig 
          onBack={handleBack}
          onSubmit={handleWprConfig}
        />
      )}

      {wprStep === "list" && wprMode === "manual" && (
        <WprList 
          previousReports={previousReports} 
          onGenerateNew={generateNewWPR}
        />
      )}

      {wprStep === "generating" && wprMode === "manual" && (
        <ProcessingView
          title="Generating Weekly Progress Report"
          description="Please wait while we collect and analyze your solar project data"
          progress={progress}
          currentStep={currentStep}
        />
      )}

      {wprStep === "results" && wprMode === "manual" && (
        <WprResults
          previousReports={previousReports}
          onViewAll={() => setWprStep("list")}
          onNewProcess={handleNewProcess}
        />
      )}

      {wprStep === "dashboard" && wprMode === "automatic" && (
        <WprAutomaticDashboard />
      )}
    </div>
  )
}