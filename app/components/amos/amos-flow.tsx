"use client"

import { useState } from "react"
import type { Target, ExtractionResult } from "@/app/types"
import AmosModeSelector from "./amos-mode-selector"
import AmosAutomaticDashboard from "./amos-automatic-dashboard"
import AmosTabbedConfig from "./amos-tabbed-config"
import ProcessingView from "../shared/processing-view"
import ResultsView from "../shared/results-view"

interface AmosFlowProps {
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

export default function AmosFlow({
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
}: AmosFlowProps) {
  const [amosStep, setAmosStep] = useState<"mode" | "config" | "processing" | "results" | "dashboard">("mode")
  const [amosMode, setAmosMode] = useState<"selection" | "manual" | "automatic">("selection")
  const [amosPlatform, setAmosPlatform] = useState<"locus" | "powertrack" | null>(null)
  const [amosConfig, setAmosConfig] = useState<any>(null)

  const handleBack = () => {
    if (amosStep !== "mode") {
      if (amosStep === "config") setAmosStep("mode")
      else if (amosStep === "results") setAmosStep("config")
      else if (amosStep === "processing") setAmosStep("config")
      else if (amosStep === "dashboard") setAmosStep("mode")
    } else {
      onBack()
    }
  }

  const handleAmosConfig = async (config: any, platform: 'locus' | 'powertrack') => {
    setAmosPlatform(platform)
    setAmosConfig(config)
    setAmosStep("processing")
    setIsExtracting(true)
    setProgress(0)
    
    try {
      const endpoint = platform === "locus" ? '/api/amos/locus' : '/api/amos/powertrack'
      setCurrentStep(`Initializing ${platform === "locus" ? "Locus Energy" : "PowerTrack"} automation...`)

      const requestData = {
        ...config,
        platform: platform
      }

      // Start the job
      setCurrentStep(`Starting ${platform} processing...`)
      const jobResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text()
        throw new Error(`Failed to start ${amosPlatform} job: ${jobResponse.status} - ${errorText}`)
      }

      const { jobId, mode } = await jobResponse.json()
      setProgress(30)
      
      setCurrentStep(mode === 'real' ? 
        `Real ${platform} automation started${config.show_browser ? ' (browser visible)' : ''}...` : 
        `Demo mode - simulating ${platform} automation...`
      )

      // Poll for status updates
      let completed = false
      while (!completed) {
        const statusResponse = await fetch(`/api/amos/status?jobId=${jobId}`)
        const status = await statusResponse.json()

        setProgress(status.progress)
        setCurrentStep(status.message)

        if (status.status === 'completed') {
          completed = true
          const result: ExtractionResult = {
            dataType: platform === "locus" ? "Locus Energy Data" : "PowerTrack Data",
            status: "success",
            count: status.recordCount || 0,
            data: status.files?.length > 0 ? status.files.map((file: any, idx: number) => ({ 
              id: idx + 1, 
              type: platform, 
              fileName: file.fileName,
              size: file.size,
              created: file.created,
              timestamp: new Date().toISOString(),
              downloadUrl: file.downloadUrl
            })) : [{ 
              id: 1, 
              type: platform, 
              timestamp: new Date().toISOString(),
              downloadUrl: status.downloadUrl 
            }],
            message: `${platform === "locus" ? "Locus Energy" : "PowerTrack"} data extraction completed successfully${status.files?.length ? ` (${status.files.length} files)` : ""}`
          }
          setResults([result])
          setTimeout(() => setAmosStep("results"), 1000)
        } else if (status.status === 'failed') {
          throw new Error(status.message || `${platform} job failed`)
        }

        if (!completed) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    } catch (error) {
      console.error(`AMOS ${platform} processing error:`, error)
      const errorResult: ExtractionResult = {
        dataType: platform === "locus" ? "Locus Energy Data" : "PowerTrack Data",
        status: "error",
        count: 0,
        data: [],
        message: error instanceof Error ? error.message : `Failed to extract ${platform} data. Please try again.`
      }
      setResults([errorResult])
    } finally {
      setIsExtracting(false)
    }
  }

  const handleNewProcess = () => {
    setAmosStep("mode")
    setAmosMode("selection")
    setResults([])
    setProgress(0)
    setAmosPlatform(null)
    setAmosConfig(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {amosStep === "mode" && (
        <AmosModeSelector 
          onModeSelect={(mode) => {
            setAmosMode(mode)
            if (mode === "manual") {
              setAmosStep("config")
            } else if (mode === "automatic") {
              setAmosStep("dashboard")
            }
          }}
        />
      )}

      {amosStep === "config" && amosMode === "manual" && (
        <AmosTabbedConfig onSubmit={handleAmosConfig} isLoading={isExtracting} />
      )}
      
      {amosStep === "processing" && amosMode === "manual" && (
        <ProcessingView
          title={`Processing ${amosPlatform === "locus" ? "Locus Energy" : "PowerTrack"} Data`}
          description="Please wait while we extract your monitoring data"
          progress={progress}
          currentStep={currentStep}
          results={results}
        />
      )}
      
      {amosStep === "results" && results.length > 0 && amosMode === "manual" && (
        <ResultsView
          title="Processing Complete!"
          description={`Your ${amosPlatform === "locus" ? "Locus Energy" : "PowerTrack"} data has been extracted and is ready for download`}
          results={results}
          onNewProcess={handleNewProcess}
          onBackToTargets={onBack}
        />
      )}

      {amosStep === "dashboard" && amosMode === "automatic" && (
        <AmosAutomaticDashboard />
      )}
    </div>
  )
}