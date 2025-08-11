import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play } from "lucide-react"
import type { Target } from "@/app/types"

interface TargetSelectorProps {
  targets: Target[]
  onTargetSelect: (target: Target) => void
}

export default function TargetSelector({ targets, onTargetSelect }: TargetSelectorProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Target System</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Choose the system you want to extract data from using automated Playwright scripts
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {targets.map((target) => (
          <Card
            key={target.id}
            className="group cursor-pointer border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.02] rounded-2xl overflow-hidden"
            onClick={() => onTargetSelect(target)}
          >
            <CardHeader className="p-8 pb-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`p-4 rounded-xl ${target.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                >
                  {target.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-[#699B1F] transition-colors">
                    {target.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {target.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500 font-medium">{target.dataTypes.length} data types</span>
                <div className="flex items-center space-x-2 text-[#699B1F] group-hover:text-[#699B1F] transition-colors">
                  <span className="text-sm font-medium">Select</span>
                  <Play className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}