"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Upload, FileSpreadsheet } from "lucide-react"

interface VendorSelectorProps {
  onSubmit: (vendors: string[]) => void
  isLoading?: boolean
}

const DEFAULT_VENDORS = [
  "Also Energy",
  "SDB LLC",
  "Fantasy Landscaping LLC",
  "United Agrivoltaics North America",
  "JUUCE Energy"
]

export default function VendorSelector({ onSubmit, isLoading = false }: VendorSelectorProps) {
  const [vendors, setVendors] = useState<string[]>([])
  const [newVendor, setNewVendor] = useState("")
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
  const [useDefaults, setUseDefaults] = useState(true)

  const handleAddVendor = () => {
    if (newVendor.trim() && !vendors.includes(newVendor.trim())) {
      setVendors([...vendors, newVendor.trim()])
      setNewVendor("")
    }
  }

  const handleRemoveVendor = (vendor: string) => {
    setVendors(vendors.filter(v => v !== vendor))
    selectedVendors.delete(vendor)
    setSelectedVendors(new Set(selectedVendors))
  }

  const handleToggleVendor = (vendor: string) => {
    const newSelected = new Set(selectedVendors)
    if (newSelected.has(vendor)) {
      newSelected.delete(vendor)
    } else {
      newSelected.add(vendor)
    }
    setSelectedVendors(newSelected)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const vendorsToSubmit = useDefaults ? DEFAULT_VENDORS : Array.from(selectedVendors)
    onSubmit(vendorsToSubmit)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real implementation, you would parse the Excel file here
      // For now, we'll just show a placeholder message
      alert("Excel file upload will be implemented with backend integration")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Vendors</CardTitle>
        <CardDescription>Choose vendors for AP-Vendor Inquiry report</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useDefaults"
                checked={useDefaults}
                onCheckedChange={(checked) => setUseDefaults(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="useDefaults" className="cursor-pointer">
                Use default vendor list from Excel
              </Label>
            </div>

            {!useDefaults && (
              <>
                <div className="space-y-2">
                  <Label>Upload Excel File</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                      id="excel-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('excel-upload')?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Excel
                    </Button>
                    <span className="text-sm text-gray-500">or add vendors manually below</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add Vendor Manually</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={newVendor}
                      onChange={(e) => setNewVendor(e.target.value)}
                      placeholder="Enter vendor name"
                      disabled={isLoading}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVendor())}
                    />
                    <Button
                      type="button"
                      onClick={handleAddVendor}
                      disabled={isLoading || !newVendor.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {vendors.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Vendors ({selectedVendors.size} selected)</Label>
                    <ScrollArea className="h-48 border rounded-md p-4">
                      <div className="space-y-2">
                        {vendors.map((vendor) => (
                          <div key={vendor} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedVendors.has(vendor)}
                                onCheckedChange={() => handleToggleVendor(vendor)}
                                disabled={isLoading}
                              />
                              <span className="text-sm">{vendor}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVendor(vendor)}
                              disabled={isLoading}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            )}
          </div>

          {useDefaults && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Default vendors from Excel:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_VENDORS.map((vendor) => (
                  <Badge key={vendor} variant="secondary">
                    {vendor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (!useDefaults && selectedVendors.size === 0)}
          >
            {isLoading ? "Processing..." : "Generate Vendor Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}