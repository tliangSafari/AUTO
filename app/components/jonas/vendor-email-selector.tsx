"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Plus, Send, Mail, Edit2, Check } from "lucide-react"
import { getStoredVendors, addVendor, updateVendor, removeVendor, saveVendors, VendorData } from "@/app/lib/vendor-storage"

interface VendorEmailSelectorProps {
  onSubmit: (vendors: string[], email: string, sendEmail: boolean) => void
  isLoading?: boolean
}

const EMAIL_OPTIONS = [
  { value: "tliang@aspenpower.com", label: "Teng Liang", initials: "TL" },
  { value: "mkajoshaj@aspenpower.com", label: "Mario Kajoshaj", initials: "MK" }
]

const INITIAL_VENDORS = [
  "Also Energy",
  "SDB LLC",
  "Fantasy Landscaping LLC",
  "United Agrivoltaics North America",
  "JUUCE Energy"
]

export default function VendorEmailSelector({ onSubmit, isLoading = false }: VendorEmailSelectorProps) {
  const [vendors, setVendors] = useState<VendorData[]>([])
  const [newVendor, setNewVendor] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [selectedEmail, setSelectedEmail] = useState(EMAIL_OPTIONS[0].value)
  const [sendEmail, setSendEmail] = useState(true)
  const newVendorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log("📋 VendorEmailSelector - Component mounted")
    console.log("📋 Default vendors (INITIAL_VENDORS):", INITIAL_VENDORS)
    loadVendors()
  }, [])

  const loadVendors = () => {
    console.log("📋 loadVendors() called")
    let storedVendors = getStoredVendors()
    console.log("📋 Vendors from localStorage:", storedVendors.map(v => v.name))
    
    // Check if we need to update to new default vendors
    const hasOldDefaults = storedVendors.some(v => 
      v.name === "Advanced Renewable Solutions" || 
      v.name === "GreenTech Energy Systems" ||
      v.name === "SolarWind Innovations"
    )
    
    // Check if we have the new required vendors
    const hasNewDefaults = storedVendors.some(v => v.name === "SDB LLC") || 
                          storedVendors.some(v => v.name === "JUUCE Energy")
    
    // If we have old defaults but not the new unique ones, reset to new defaults
    if (hasOldDefaults && !hasNewDefaults) {
      console.log("🔄 Updating to new default vendors...")
      console.log("🔄 Clearing old vendors:", storedVendors.map(v => v.name))
      // Clear old vendors
      localStorage.removeItem('jonas_vendors')
      storedVendors = []
    }
    
    // Initialize with default vendors if empty
    if (storedVendors.length === 0) {
      console.log("📋 No vendors in storage, initializing with defaults...")
      storedVendors = INITIAL_VENDORS.map(name => ({
        id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        lastUsed: new Date().toISOString()
      }))
      saveVendors(storedVendors)
    }
    
    console.log("📋 Final vendor list being displayed:", storedVendors.map(v => v.name))
    setVendors(storedVendors)
  }

  const handleAddVendor = () => {
    const trimmedName = newVendor.trim()
    if (!trimmedName) return
    
    // Check if vendor already exists
    if (vendors.some(v => v.name.toLowerCase() === trimmedName.toLowerCase())) {
      setNewVendor("")
      return
    }
    
    addVendor(trimmedName)
    loadVendors()
    setNewVendor("")
  }

  const handleStartEdit = (vendor: VendorData) => {
    setEditingId(vendor.id)
    setEditingName(vendor.name)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return
    
    updateVendor(editingId, { name: editingName.trim() })
    loadVendors()
    setEditingId(null)
    setEditingName("")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName("")
  }

  const handleResetToDefaults = () => {
    // Clear localStorage and reset to default vendors
    localStorage.removeItem('jonas_vendors')
    const defaultVendors = INITIAL_VENDORS.map(name => ({
      id: `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      lastUsed: new Date().toISOString()
    }))
    saveVendors(defaultVendors)
    setVendors(defaultVendors)
    console.log("✅ Reset to default vendors:", INITIAL_VENDORS)
  }

  const handleRemoveVendor = (vendorId: string) => {
    removeVendor(vendorId)
    loadVendors()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const vendorNames = vendors.map(v => v.name)
    
    if (vendorNames.length === 0) return
    
    onSubmit(vendorNames, selectedEmail, sendEmail)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Configure Vendor Report</CardTitle>
        <CardDescription>Select vendors and email settings for AP-Vendor Inquiry report</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vendor List Section */}
          <div className="space-y-4">
            <div className="border-b pb-2 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Vendors</h3>
                <p className="text-sm text-gray-500">Edit the list below to customize your vendor selection</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
                className="text-sm"
              >
                Reset to Defaults
              </Button>
            </div>
            
            {/* Vendor List */}
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-3 space-y-1">
                {vendors.map((vendor) => (
                  <div 
                    key={vendor.id} 
                    className="group flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors border border-transparent"
                  >
                    {editingId === vendor.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="flex-1 cursor-pointer py-1"
                          onClick={() => handleStartEdit(vendor)}
                        >
                          {vendor.name}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(vendor)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveVendor(vendor.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                {vendors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No vendors added yet
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Add New Vendor */}
            <div className="flex gap-2">
              <Input
                ref={newVendorInputRef}
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddVendor()
                  }
                }}
                placeholder="Add a new vendor..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleAddVendor}
                disabled={!newVendor.trim() || isLoading}
                className={newVendor.trim() ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                variant={newVendor.trim() ? "default" : "secondary"}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email Configuration Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">Email Configuration</h3>
            </div>
            
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
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || vendors.length === 0}
          >
            {isLoading ? (
              "Processing..."
            ) : sendEmail ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Generate & Send Report
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Generate & Download Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}