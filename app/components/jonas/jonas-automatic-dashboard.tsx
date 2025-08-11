"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Calendar,
  Users,
  Settings,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from "lucide-react"
import type { AutomationRun, AutomationConfig, SampleDataFile } from "@/app/types"
import AutomationConfigDialog from "../shared/automation-config-dialog"

// Mock data
const mockAutomationRuns: AutomationRun[] = [
  {
    id: "run-001",
    date: "2025-01-22 09:00:00",
    status: "success",
    recordsProcessed: 1247,
    duration: "3m 42s",
    dataTypes: ["Vendors", "Accounts"],
    downloadUrl: "/api/jonas/download?file=run-001.xlsx"
  },
  {
    id: "run-002", 
    date: "2025-01-21 09:00:00",
    status: "success",
    recordsProcessed: 1189,
    duration: "3m 18s",
    dataTypes: ["Vendors", "Accounts"],
    downloadUrl: "/api/jonas/download?file=run-002.xlsx"
  },
  {
    id: "run-003",
    date: "2025-01-20 09:00:00", 
    status: "failed",
    recordsProcessed: 0,
    duration: "1m 12s",
    dataTypes: ["Vendors", "Accounts"],
    errorMessage: "Authentication timeout - Jonas server was unreachable"
  },
  {
    id: "run-004",
    date: "2025-01-19 09:00:00",
    status: "success", 
    recordsProcessed: 1356,
    duration: "4m 01s",
    dataTypes: ["Vendors", "Accounts"],
    downloadUrl: "/api/jonas/download?file=run-004.xlsx"
  },
  {
    id: "run-005",
    date: "2025-01-18 09:00:00",
    status: "success",
    recordsProcessed: 1298,
    duration: "3m 55s", 
    dataTypes: ["Vendors"],
    downloadUrl: "/api/jonas/download?file=run-005.xlsx"
  }
]

const initialAutomationConfig: AutomationConfig = {
  schedule: "Daily at 9:00 AM",
  frequency: "Every 24 hours",
  dataTypes: ["Vendors (AP-Vendor Inquiry)", "Accounts (GL Transactions)"],
  emailRecipients: ["tliang@aspenpower.com", "team@aspenpower.com"],
  retryPolicy: "3 attempts with 5min intervals",
  lastRun: "2025-01-22 09:00:00",
  nextRun: "2025-01-23 09:00:00",
  status: "active",
  timezone: "EST (UTC-5)"
}

const mockSampleFiles: SampleDataFile[] = [
  {
    id: "sample-001",
    name: "Vendor_Report_Sample.xlsx",
    description: "Sample vendor report with pending invoices and payment details",
    size: "245 KB",
    type: "excel",
    downloadUrl: "/api/jonas/samples/vendor-sample.xlsx", 
    previewAvailable: true
  },
  {
    id: "sample-002", 
    name: "Account_Report_Sample.xlsx",
    description: "Sample GL transactions report with account codes and balances",
    size: "189 KB", 
    type: "excel",
    downloadUrl: "/api/jonas/samples/account-sample.xlsx",
    previewAvailable: true
  },
  {
    id: "sample-003",
    name: "Jonas_Data_Dictionary.pdf", 
    description: "Field definitions and data structure documentation",
    size: "1.2 MB",
    type: "pdf", 
    downloadUrl: "/api/jonas/samples/data-dictionary.pdf",
    previewAvailable: false
  }
]

export default function JonasAutomaticDashboard() {
  const [automationConfig, setAutomationConfig] = useState(initialAutomationConfig)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)

  const handleConfigSave = (newConfig: any) => {
    setAutomationConfig({ ...automationConfig, ...newConfig })
    // In a real app, this would save to backend
    console.log("Saving automation config:", newConfig)
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "in_progress":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800", 
      in_progress: "bg-blue-100 text-blue-800"
    }
    return (
      <Badge className={`${variants[status]} border-0`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "excel":
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />
      case "csv": 
        return <FileText className="h-5 w-5 text-blue-600" />
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">AM Automation Automatic Mode</h2>
        <p className="text-lg text-gray-600">
          Automated AM Automation data extraction with intelligent scheduling
        </p>
      </div>

      {/* Automation Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>Automation Configuration</CardTitle>
                <CardDescription>Current automation settings and schedule</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsConfigDialogOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Schedule</p>
                  <p className="text-sm text-gray-600">{automationConfig.schedule}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Frequency</p>
                  <p className="text-sm text-gray-600">{automationConfig.frequency}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={automationConfig.status === "active" ? "bg-green-100 text-green-800 border-0" : "bg-gray-100 text-gray-800 border-0"}>
                      {automationConfig.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600">({automationConfig.timezone})</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Data Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {automationConfig.dataTypes.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type.split(" ")[0]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email Recipients</p>
                  <p className="text-sm text-gray-600">{automationConfig.emailRecipients.length} recipients</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Next Run</p>
                  <p className="text-sm text-gray-600">{new Date(automationConfig.nextRun).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Runs History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle>Previous Runs</CardTitle>
                <CardDescription>Recent automatic execution history</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {mockAutomationRuns.map((run) => (
                <div key={run.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(run.status)}
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(run.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(run.date).toLocaleTimeString()}
                      </span>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                    <span>Records: {run.recordsProcessed.toLocaleString()}</span>
                    <span>Duration: {run.duration}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {run.dataTypes.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  
                  {run.status === "failed" && run.errorMessage && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2">
                      {run.errorMessage}
                    </div>
                  )}
                  
                  {run.downloadUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(run.downloadUrl, '_blank')}
                      className="w-full"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download Report
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AutomationConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        config={automationConfig}
        onSave={handleConfigSave}
        title="AM Automation"
      />
    </div>
  )
}