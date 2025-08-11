import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database } from "lucide-react"
import type { Target } from "@/app/types"

interface DashboardHeaderProps {
  selectedTarget: Target | null
  onBack: () => void
}

export default function DashboardHeader({ selectedTarget, onBack }: DashboardHeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selectedTarget && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#699B1F] rounded-lg flex items-center justify-center shadow-sm">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-gray-900">AUTO</h1>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600 mr-4">
            v2.1.0
          </Badge>
        </div>
      </div>
    </header>
  )
}