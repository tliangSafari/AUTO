import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, FileText } from "lucide-react"
import type { WPRReport } from "@/app/types"
import { getCurrentWeekString } from "@/app/lib/utils"

interface WprResultsProps {
  previousReports: WPRReport[]
  onViewAll: () => void
  onNewProcess?: () => void
}

export default function WprResults({ previousReports, onViewAll, onNewProcess }: WprResultsProps) {
  const latestReport = previousReports[0]
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          WPR Generated Successfully
        </CardTitle>
        <CardDescription>Your Weekly Progress Report has been created and is ready for download</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Report Ready</h4>
              <p className="text-sm text-green-700">
                WPR for {getCurrentWeekString()} has been generated with solar project performance data
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              if (latestReport?.downloadUrl) {
                window.open(latestReport.downloadUrl, '_blank')
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          {onNewProcess ? (
            <Button 
              variant="outline" 
              onClick={onNewProcess}
            >
              New WPR
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={onViewAll}
            >
              View All Reports
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}