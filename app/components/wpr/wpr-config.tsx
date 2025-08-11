"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, FileText, Mail, ArrowLeft } from "lucide-react"

interface WPRConfig {
  reportType: "current_week" | "last_week" | "custom_range"
  customStartDate?: string
  customEndDate?: string
  projects: string[]
  reportFormat: "excel" | "pdf" | "both"
  includeCharts: boolean
  includeMaintenance: boolean
  includeWeatherData: boolean
  emailDelivery: boolean
  emailRecipients: string[]
  show_browser: boolean
}

interface WPRConfigProps {
  onBack: () => void
  onSubmit: (config: WPRConfig) => void
}

export default function WPRConfig({ onBack, onSubmit }: WPRConfigProps) {
  const [config, setConfig] = useState<WPRConfig>({
    reportType: "current_week",
    projects: ["all"],
    reportFormat: "excel",
    includeCharts: true,
    includeMaintenance: true,
    includeWeatherData: false,
    emailDelivery: false,
    emailRecipients: [],
    show_browser: false
  })

  const [emailInput, setEmailInput] = useState("")

  // Get current week date range (Monday to Sunday)
  const getCurrentWeekRange = () => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    }
  }

  // Get last week date range (Monday to Sunday)
  const getLastWeekRange = () => {
    const now = new Date()
    const lastMonday = new Date(now)
    lastMonday.setDate(now.getDate() - now.getDay() - 6)
    
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)

    return {
      start: lastMonday.toISOString().split('T')[0],
      end: lastSunday.toISOString().split('T')[0]
    }
  }

  const currentWeek = getCurrentWeekRange()
  const lastWeek = getLastWeekRange()

  const addEmailRecipient = () => {
    if (emailInput && emailInput.includes('@')) {
      setConfig(prev => ({
        ...prev,
        emailRecipients: [...prev.emailRecipients, emailInput]
      }))
      setEmailInput("")
    }
  }

  const removeEmailRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter(e => e !== email)
    }))
  }

  const handleSubmit = () => {
    onSubmit(config)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold">WPR Configuration</h2>
          <p className="text-sm text-muted-foreground">Configure your Weekly Progress Report generation</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Report Period
            </CardTitle>
            <CardDescription>Select the time period for your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select 
                value={config.reportType} 
                onValueChange={(value: "current_week" | "last_week" | "custom_range") => 
                  setConfig(prev => ({ ...prev, reportType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_week">
                    Current Week ({currentWeek.start} to {currentWeek.end})
                  </SelectItem>
                  <SelectItem value="last_week">
                    Last Week ({lastWeek.start} to {lastWeek.end})
                  </SelectItem>
                  <SelectItem value="custom_range">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.reportType === "custom_range" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={config.customStartDate || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, customStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={config.customEndDate || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, customEndDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Content
            </CardTitle>
            <CardDescription>Configure what to include in your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-format">Report Format</Label>
              <Select 
                value={config.reportFormat} 
                onValueChange={(value: "excel" | "pdf" | "both") => 
                  setConfig(prev => ({ ...prev, reportFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="both">Both Excel and PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCharts: !!checked }))}
                />
                <Label htmlFor="charts">Include performance charts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintenance"
                  checked={config.includeMaintenance}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeMaintenance: !!checked }))}
                />
                <Label htmlFor="maintenance">Include maintenance activities</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weather"
                  checked={config.includeWeatherData}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeWeatherData: !!checked }))}
                />
                <Label htmlFor="weather">Include weather data</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="browser"
                  checked={config.show_browser}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, show_browser: !!checked }))}
                />
                <Label htmlFor="browser">Show browser window during generation</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Delivery */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Delivery
            </CardTitle>
            <CardDescription>Configure email delivery options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-delivery"
                checked={config.emailDelivery}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, emailDelivery: !!checked }))}
              />
              <Label htmlFor="email-delivery">Send report via email after generation</Label>
            </div>

            {config.emailDelivery && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
                  />
                  <Button onClick={addEmailRecipient}>Add</Button>
                </div>

                {config.emailRecipients.length > 0 && (
                  <div>
                    <Label>Recipients:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {config.emailRecipients.map((email) => (
                        <span 
                          key={email} 
                          className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm cursor-pointer"
                          onClick={() => removeEmailRecipient(email)}
                        >
                          {email} ×
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="min-w-32">
          Generate WPR
        </Button>
      </div>
    </div>
  )
}