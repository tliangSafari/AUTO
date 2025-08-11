"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Activity } from "lucide-react"
import LocusConfig from "./locus-config"
import PowerTrackConfig from "./powertrack-config"

interface AmosTabbedConfigProps {
  onSubmit: (config: any, platform: 'locus' | 'powertrack') => void
  isLoading?: boolean
}

export default function AmosTabbedConfig({ onSubmit, isLoading = false }: AmosTabbedConfigProps) {
  const [activeTab, setActiveTab] = useState<'locus' | 'powertrack'>('locus')

  const handleLocusSubmit = (config: any) => {
    onSubmit(config, 'locus')
  }

  const handlePowerTrackSubmit = (config: any) => {
    onSubmit(config, 'powertrack')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'locus' | 'powertrack')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger 
            value="locus" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">Locus Energy</span>
          </TabsTrigger>
          <TabsTrigger 
            value="powertrack" 
            className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">PowerTrack</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="locus" className="mt-6">
          <LocusConfig onSubmit={handleLocusSubmit} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="powertrack" className="mt-6">
          <PowerTrackConfig onSubmit={handlePowerTrackSubmit} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}