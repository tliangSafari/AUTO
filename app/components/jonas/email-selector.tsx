"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Mail, Send } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface EmailSelectorProps {
  onSubmit: (email: string, sendEmail: boolean, showBrowser?: boolean) => void
  isLoading?: boolean
  reportType: "vendor" | "account"
}

const EMAIL_OPTIONS = [
  { value: "tliang@aspenpower.com", label: "Teng Liang", initials: "TL" },
  { value: "mkajoshaj@aspenpower.com", label: "Mario Kajoshaj", initials: "MK" }
]

export default function EmailSelector({ onSubmit, isLoading = false, reportType }: EmailSelectorProps) {
  const [selectedEmail, setSelectedEmail] = useState(EMAIL_OPTIONS[0].value)
  const [sendEmail, setSendEmail] = useState(true)
  const [showBrowser, setShowBrowser] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedEmail, sendEmail, showBrowser)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Configuration</CardTitle>
        <CardDescription>Choose where to send the {reportType} report</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="sendEmail" className="cursor-pointer">
                Send report via email
              </Label>
            </div>

            {sendEmail && (
              <div className="space-y-3">
                <Label>Select recipient</Label>
                <RadioGroup value={selectedEmail} onValueChange={setSelectedEmail} disabled={isLoading}>
                  {EMAIL_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex items-center space-x-3 cursor-pointer flex-1">
                        <div className="w-10 h-10 bg-[#699B1F] text-white rounded-full flex items-center justify-center font-semibold">
                          {option.initials}
                        </div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.value}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {!sendEmail && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  The report will be downloaded to your local machine only.
                </p>
              </div>
            )}

            {/* Browser Visibility Option */}
            <div className="space-y-3">
              <Label>Browser Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showBrowser"
                  checked={showBrowser}
                  onCheckedChange={(checked) => setShowBrowser(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="showBrowser" className="cursor-pointer text-sm">
                  Show browser window during automation
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                When enabled, you can watch the automation process in real-time. 
                Keep disabled for faster processing.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Processing..."
            ) : sendEmail ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Download Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}