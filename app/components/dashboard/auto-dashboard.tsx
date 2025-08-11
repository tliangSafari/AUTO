"use client"

import { useState } from "react"
import { targets } from "@/app/constants/targets"
import type { Target, DataType, ExtractionResult } from "@/app/types"
import DashboardHeader from "./dashboard-header"
import TargetSelector from "./target-selector"
import JonasFlow from "../jonas/jonas-flow"
import AmosFlow from "../amos/amos-flow"
import WprFlow from "../wpr/wpr-flow"

export default function AutoDashboard() {
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [dataTypes, setDataTypes] = useState<DataType[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [currentStep, setCurrentStep] = useState("")

  const handleTargetSelect = (target: Target) => {
    setSelectedTarget(target)
    setDataTypes([...target.dataTypes])
    setResults([])
    setProgress(0)
  }

  const handleBack = () => {
    setSelectedTarget(null)
    setDataTypes([])
    setResults([])
    setProgress(0)
    setIsExtracting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader selectedTarget={selectedTarget} onBack={handleBack} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!selectedTarget ? (
          <TargetSelector targets={targets} onTargetSelect={handleTargetSelect} />
        ) : selectedTarget.id === "jonas" ? (
          <JonasFlow
            selectedTarget={selectedTarget}
            isExtracting={isExtracting}
            setIsExtracting={setIsExtracting}
            progress={progress}
            setProgress={setProgress}
            results={results}
            setResults={setResults}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            onBack={handleBack}
          />
        ) : selectedTarget.id === "amos" ? (
          <AmosFlow
            selectedTarget={selectedTarget}
            isExtracting={isExtracting}
            setIsExtracting={setIsExtracting}
            progress={progress}
            setProgress={setProgress}
            results={results}
            setResults={setResults}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            onBack={handleBack}
          />
        ) : selectedTarget.id === "wpr" ? (
          <WprFlow
            selectedTarget={selectedTarget}
            isExtracting={isExtracting}
            setIsExtracting={setIsExtracting}
            progress={progress}
            setProgress={setProgress}
            results={results}
            setResults={setResults}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            onBack={handleBack}
          />
        ) : null}
      </main>
    </div>
  )
}