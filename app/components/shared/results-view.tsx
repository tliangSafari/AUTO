import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Download, FileText, Eye } from "lucide-react"
import type { ExtractionResult } from "@/app/types"

interface ResultsViewProps {
  title: string
  description: string
  results: ExtractionResult[]
  reportType?: string | null
  onNewProcess: () => void
  onBackToTargets: () => void
}

export default function ResultsView({ 
  title, 
  description, 
  results, 
  reportType,
  onNewProcess, 
  onBackToTargets 
}: ResultsViewProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.map((result, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{result.dataType}</p>
                  <p className="text-sm text-green-700">{result.message}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {result.count} records
              </Badge>
            </div>

            {result.data?.some(item => item.downloadUrl) && (
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Download Files</h3>
                  {result.data.filter(item => item.downloadUrl).length > 1 && (
                    <Button
                      onClick={() => {
                        result.data.forEach(item => {
                          if (item.downloadUrl) {
                            window.open(item.downloadUrl, '_blank')
                          }
                        })
                      }}
                      className="bg-[#699B1F] hover:bg-[#699B1F]/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All Files
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-3">
                  {result.data.filter(item => item.downloadUrl).map((file, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {file.fileName || `${reportType === "vendors" ? "Vendor Report" : reportType === "accounts" ? "Account Report" : "Report"}.xlsx`}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{file.size ? `${Math.round(file.size / 1024)} KB` : "Unknown size"}</span>
                            <span>{file.fileName?.toLowerCase().endsWith('.html') ? 'HTML Report' : 'Excel Format'}</span>
                            <span>{file.created ? new Date(file.created).toLocaleString() : new Date().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {file.fileName?.toLowerCase().endsWith('.html') && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(`/api/jonas/preview?fileName=${encodeURIComponent(file.fileName)}`, '_blank')}
                            className="text-sm"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button
                          onClick={() => window.open(file.downloadUrl, '_blank')}
                          className="bg-[#699B1F] hover:bg-[#699B1F]/90"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onNewProcess}>
            Start New Process
          </Button>
          <Button variant="outline" onClick={onBackToTargets}>
            Back to Targets
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}