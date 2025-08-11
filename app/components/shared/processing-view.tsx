import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, FileText, Download } from "lucide-react"
import type { ExtractionResult } from "@/app/types"

interface ProcessingViewProps {
  title: string
  description: string
  progress: number
  currentStep: string
  results?: ExtractionResult[]
}

export default function ProcessingView({ title, description, progress, currentStep, results = [] }: ProcessingViewProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-[#699B1F]">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mb-4 h-2" />
          <p className="text-sm text-gray-600">{currentStep}</p>
        </div>
        
        {results.length > 0 && progress < 100 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {result.status === "success" && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    )}
                    {result.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{result.dataType}</p>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      
                      {result.data?.some(item => item.downloadUrl) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">
                              Available Files ({result.data.filter(item => item.downloadUrl).length}):
                            </p>
                            {result.data.filter(item => item.downloadUrl).length > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  result.data.forEach(item => {
                                    if (item.downloadUrl) {
                                      window.open(item.downloadUrl, '_blank')
                                    }
                                  })
                                }}
                                className="text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download All
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {result.data.filter(item => item.downloadUrl).map((file, fileIndex) => (
                              <div key={fileIndex} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {file.fileName || "Report"}
                                      </p>
                                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                                        <span>
                                          {file.size ? `${Math.round(file.size / 1024)} KB` : "Unknown size"}
                                        </span>
                                        <span>
                                          Generated: {file.created ? new Date(file.created).toLocaleString() : new Date().toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => window.open(file.downloadUrl, '_blank')}
                                    className="bg-[#699B1F] hover:bg-[#699B1F]/90"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}