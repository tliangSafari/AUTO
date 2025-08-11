"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Plus, Save } from "lucide-react"

interface AutomationConfig {
  schedule: string
  frequency: string
  timezone: string
  emailRecipients: string[]
  status: "active" | "paused"
  retryPolicy: string
}

interface AutomationConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  config: AutomationConfig
  onSave: (config: AutomationConfig) => void
  title: string
}

export default function AutomationConfigDialog({
  isOpen,
  onClose,
  config,
  onSave,
  title
}: AutomationConfigDialogProps) {
  const [editConfig, setEditConfig] = useState<AutomationConfig>(config)
  const [newEmail, setNewEmail] = useState("")

  const handleSave = () => {
    onSave(editConfig)
    onClose()
  }

  const addEmail = () => {
    if (newEmail && !editConfig.emailRecipients.includes(newEmail)) {
      setEditConfig({
        ...editConfig,
        emailRecipients: [...editConfig.emailRecipients, newEmail]
      })
      setNewEmail("")
    }
  }

  const removeEmail = (email: string) => {
    setEditConfig({
      ...editConfig,
      emailRecipients: editConfig.emailRecipients.filter(e => e !== email)
    })
  }

  const scheduleOptions = [
    "Daily at 6:00 AM",
    "Daily at 7:00 AM", 
    "Daily at 8:00 AM",
    "Daily at 9:00 AM",
    "Daily at 10:00 AM",
    "Weekly on Monday at 8:00 AM",
    "Weekly on Friday at 5:00 PM",
    "Monthly on 1st at 8:00 AM",
    "Monthly on 15th at 8:00 AM"
  ]

  const frequencyOptions = [
    "Every 24 hours",
    "Every 12 hours",
    "Every 7 days",
    "Every 30 days",
    "Every hour",
    "Every 6 hours"
  ]

  const timezoneOptions = [
    "EST (UTC-5)",
    "CST (UTC-6)",
    "MST (UTC-7)",
    "PST (UTC-8)",
    "UTC"
  ]

  const retryOptions = [
    "3 attempts with 5min intervals",
    "3 attempts with 10min intervals", 
    "5 attempts with 5min intervals",
    "No retry",
    "1 attempt after 30min"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title} - Automation Configuration</DialogTitle>
          <DialogDescription>
            Configure schedule, frequency, and notification settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="status" className="text-base">Automation Status</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="status" className="text-sm text-gray-500">
                {editConfig.status === "active" ? "Active" : "Paused"}
              </Label>
              <Switch
                id="status"
                checked={editConfig.status === "active"}
                onCheckedChange={(checked) => 
                  setEditConfig({ ...editConfig, status: checked ? "active" : "paused" })
                }
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Select
              value={editConfig.schedule}
              onValueChange={(value) => setEditConfig({ ...editConfig, schedule: value })}
            >
              <SelectTrigger id="schedule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scheduleOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={editConfig.frequency}
              onValueChange={(value) => setEditConfig({ ...editConfig, frequency: value })}
            >
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={editConfig.timezone}
              onValueChange={(value) => setEditConfig({ ...editConfig, timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Retry Policy */}
          <div className="space-y-2">
            <Label htmlFor="retry">Retry Policy</Label>
            <Select
              value={editConfig.retryPolicy}
              onValueChange={(value) => setEditConfig({ ...editConfig, retryPolicy: value })}
            >
              <SelectTrigger id="retry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {retryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Recipients */}
          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                {editConfig.emailRecipients.map((email) => (
                  <Badge key={email} variant="secondary" className="cursor-pointer">
                    {email}
                    <X
                      className="h-3 w-3 ml-1 hover:text-red-500"
                      onClick={() => removeEmail(email)}
                    />
                  </Badge>
                ))}
                {editConfig.emailRecipients.length === 0 && (
                  <span className="text-sm text-gray-500">No recipients configured</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addEmail()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                  disabled={!newEmail}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}