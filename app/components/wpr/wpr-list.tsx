import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import type { WPRReport } from "@/app/types"

interface WprListProps {
  previousReports: WPRReport[]
  onGenerateNew: () => void
}

export default function WprList({ previousReports, onGenerateNew }: WprListProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Weekly Progress Reports
          </CardTitle>
          <CardDescription>
            View and download previous WPR reports or generate a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Previous Reports</h3>
            <Button onClick={onGenerateNew} className="bg-[#699B1F] hover:bg-[#5a8418]">
              <FileText className="w-4 h-4 mr-2" />
              Generate New WPR
            </Button>
          </div>
          
          {previousReports.length > 0 ? (
            <div className="space-y-3">
              {previousReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#699B1F] rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{report.filename}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Week: {report.week}</span>
                              <span>{report.size}</span>
                              <span>{report.projects} projects</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(report.generated).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(report.downloadUrl, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-500 mb-4">Generate your first Weekly Progress Report to get started</p>
              <Button onClick={onGenerateNew} className="bg-[#699B1F] hover:bg-[#5a8418]">
                Generate First WPR
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}