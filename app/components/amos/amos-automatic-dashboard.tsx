"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  FileSpreadsheet,
  Zap,
  MonitorSpeaker
} from "lucide-react"
import AutomationConfigDialog from "../shared/automation-config-dialog"

// Mock automation data for PowerTrack
const mockPowerTrackRuns = [
  {
    id: "pt-001",
    date: "2025-07-22 07:00:00",
    status: "success" as const,
    recordsProcessed: 847,
    duration: "4m 12s",
    dataTypes: ["PowerTrack Monitoring"],
    downloadUrl: "/api/amos/download?file=powertrack-2025-07-22.xlsx"
  },
  {
    id: "pt-002", 
    date: "2025-07-21 07:00:00",
    status: "success" as const,
    recordsProcessed: 823,
    duration: "3m 58s",
    dataTypes: ["PowerTrack Monitoring"],
    downloadUrl: "/api/amos/download?file=powertrack-2025-07-21.xlsx"
  },
  {
    id: "pt-003",
    date: "2025-07-20 07:00:00", 
    status: "failed" as const,
    recordsProcessed: 0,
    duration: "1m 23s",
    dataTypes: ["PowerTrack Monitoring"],
    errorMessage: "PowerTrack API connection timeout"
  }
]

// Mock automation data for Locus
const mockLocusRuns = [
  {
    id: "locus-001",
    date: "2025-07-22 06:30:00",
    status: "success" as const,
    recordsProcessed: 1247,
    duration: "5m 34s",
    dataTypes: ["Locus Energy Data"],
    downloadUrl: "/api/amos/download?file=locus-2025-07-22.xlsx"
  },
  {
    id: "locus-002", 
    date: "2025-07-21 06:30:00",
    status: "success" as const,
    recordsProcessed: 1189,
    duration: "5m 18s",
    dataTypes: ["Locus Energy Data"],
    downloadUrl: "/api/amos/download?file=locus-2025-07-21.xlsx"
  },
  {
    id: "locus-003",
    date: "2025-07-20 06:30:00", 
    status: "success" as const,
    recordsProcessed: 1356,
    duration: "6m 01s",
    dataTypes: ["Locus Energy Data"],
    downloadUrl: "/api/amos/download?file=locus-2025-07-20.xlsx"
  }
]

const mockPowerTrackConfig = {
  schedule: "Daily at 7:00 AM",
  frequency: "Every 24 hours",
  dataTypes: ["PowerTrack Monitoring Data", "Performance Metrics"],
  emailRecipients: ["tliang@aspenpower.com", "team@aspenpower.com"],
  retryPolicy: "3 attempts with 10min intervals",
  lastRun: "2025-07-22 07:00:00",
  nextRun: "2025-07-23 07:00:00",
  status: "active" as const,
  timezone: "EST (UTC-5)"
}

const mockLocusConfig = {
  schedule: "Daily at 6:30 AM",
  frequency: "Every 24 hours", 
  dataTypes: ["Locus Energy Data", "Site Performance", "Weather Data"],
  emailRecipients: ["tliang@aspenpower.com", "team@aspenpower.com"],
  retryPolicy: "3 attempts with 10min intervals",
  lastRun: "2025-07-22 06:30:00",
  nextRun: "2025-07-23 06:30:00",
  status: "active" as const,
  timezone: "EST (UTC-5)"
}

export default function AmosAutomaticDashboard() {
  const [activeTab, setActiveTab] = useState("powertrack")
  const [configDialogOpen, setConfigDialogOpen] = useState<"powertrack" | "locus" | null>(null)
  const [currentConfig, setCurrentConfig] = useState<typeof mockPowerTrackConfig | null>(null)

  // Dialog handlers
  const openConfigDialog = (platform: "powertrack" | "locus") => {
    const config = platform === "powertrack" ? mockPowerTrackConfig : mockLocusConfig
    setCurrentConfig(config)
    setConfigDialogOpen(platform)
  }

  const closeConfigDialog = () => {
    setConfigDialogOpen(null)
    setCurrentConfig(null)
  }

  const saveConfigDialog = (config: typeof mockPowerTrackConfig) => {
    // In a real app, this would save to backend/state management
    console.log("Saving config:", config)
    // For now, just close the dialog
    closeConfigDialog()
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

  const renderAutomationConfig = (config: typeof mockPowerTrackConfig, platform: string, icon: any) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>{platform} Configuration</CardTitle>
              <CardDescription>Current automation settings and schedule</CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openConfigDialog(platform === "PowerTrack" ? "powertrack" : "locus")}
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
                <p className="text-sm text-gray-600">{config.schedule}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Frequency</p>
                <p className="text-sm text-gray-600">{config.frequency}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 border-0">
                    {config.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">({config.timezone})</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {icon}
              <div>
                <p className="text-sm font-medium text-gray-700">Data Types</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {config.dataTypes.map((type, index) => (
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
                <p className="text-sm text-gray-600">{config.emailRecipients.length} recipients</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Next Run</p>
                <p className="text-sm text-gray-600">{new Date(config.nextRun).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreviousRuns = (runs: typeof mockPowerTrackRuns, platform: string) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle>Previous {platform} Runs</CardTitle>
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
            {runs.map((run) => (
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
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">AMOS Automatic Mode</h2>
        <p className="text-lg text-gray-600">
          Automated monitoring data extraction with intelligent scheduling
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="powertrack" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            PowerTrack
          </TabsTrigger>
          <TabsTrigger value="locus" className="flex items-center gap-2">
            <MonitorSpeaker className="h-4 w-4" />
            Locus Energy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="powertrack" className="space-y-6 mt-6">
          {renderAutomationConfig(mockPowerTrackConfig, "PowerTrack", <Zap className="h-4 w-4 text-gray-500" />)}
          {renderPreviousRuns(mockPowerTrackRuns, "PowerTrack")}
        </TabsContent>

        <TabsContent value="locus" className="space-y-6 mt-6">
          {renderAutomationConfig(mockLocusConfig, "Locus Energy", <MonitorSpeaker className="h-4 w-4 text-gray-500" />)}
          {renderPreviousRuns(mockLocusRuns, "Locus")}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      {configDialogOpen && currentConfig && (
        <AutomationConfigDialog
          isOpen={configDialogOpen !== null}
          onClose={closeConfigDialog}
          config={currentConfig}
          onSave={saveConfigDialog}
          title={configDialogOpen === "powertrack" ? "PowerTrack" : "Locus Energy"}
        />
      )}
    </div>
  )
}