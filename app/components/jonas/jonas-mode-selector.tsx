import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Play, RefreshCw } from "lucide-react"

interface JonasModeSelectorProps {
  onModeSelect: (mode: "manual" | "automatic") => void
}

export default function JonasModeSelector({ onModeSelect }: JonasModeSelectorProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-semibold text-gray-900 mb-4">Choose Processing Mode</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Select how you want to process AM Automation data extraction
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card
          className="group cursor-pointer border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] rounded-2xl overflow-hidden"
          onClick={() => onModeSelect("manual")}
        >
          <CardHeader className="p-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-xl bg-[#699B1F] text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-[#699B1F] transition-colors">
                  Manual
                </CardTitle>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Configure AM Automation extraction step-by-step with full control over settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex items-center justify-center pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-[#699B1F] group-hover:text-[#699B1F] transition-colors">
                <span className="text-sm font-medium">Configure</span>
                <Play className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] rounded-2xl overflow-hidden"
          onClick={() => onModeSelect("automatic")}
        >
          <CardHeader className="p-8 pb-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-xl bg-blue-600 text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Automatic
                </CardTitle>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Automated AM Automation extraction with intelligent scheduling and monitoring
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex items-center justify-center pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-blue-600 group-hover:text-blue-600 transition-colors">
                <span className="text-sm font-medium">View Dashboard</span>
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}