"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText } from "lucide-react"
import VendorEmailSelector from "./vendor-email-selector"
import AccountConfig from "./account-config"

interface JonasTabbedConfigProps {
  onSubmit: (config: any, dataType: 'vendors' | 'accounts') => void
  isLoading?: boolean
}

export default function JonasTabbedConfig({ onSubmit, isLoading = false }: JonasTabbedConfigProps) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'accounts'>('vendors')

  const handleVendorSubmit = (vendors: string[], email: string, sendEmail: boolean) => {
    console.log("🟣 JonasTabbedConfig - Vendors being submitted:", vendors)
    console.log("🟣 JonasTabbedConfig - Email:", email, "Send:", sendEmail)
    const config = { vendors, email, sendEmail }
    onSubmit(config, 'vendors')
  }

  const handleAccountSubmit = (config: any) => {
    onSubmit(config, 'accounts')
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'vendors' | 'accounts')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger 
            value="vendors" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Vendors</span>
          </TabsTrigger>
          <TabsTrigger 
            value="accounts" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Accounts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="vendors" className="mt-6">
          <VendorEmailSelector onSubmit={handleVendorSubmit} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="accounts" className="mt-6">
          <AccountConfig onSubmit={handleAccountSubmit} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}