"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface PowerTrackConfig {
  monitoring_platform_id: string
  start_date: string
  end_date: string
  show_browser: boolean
}

interface PowerTrackConfigProps {
  onSubmit: (config: PowerTrackConfig) => void
  isLoading?: boolean
}

export default function PowerTrackConfig({ onSubmit, isLoading = false }: PowerTrackConfigProps) {
  const [config, setConfig] = useState<PowerTrackConfig>({
    monitoring_platform_id: '',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    show_browser: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(config)
  }

  const handleInputChange = (field: keyof PowerTrackConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>PowerTrack Configuration</CardTitle>
        <CardDescription>
          Configure the parameters for PowerTrack data extraction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="monitoring_platform_id">Monitoring Platform ID / Site ID</Label>
              <Input
                id="monitoring_platform_id"
                type="text"
                value={config.monitoring_platform_id}
                onChange={(e) => handleInputChange('monitoring_platform_id', e.target.value)}
                placeholder="e.g., 42541"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                The site identifier in PowerTrack system (Asset ID from your Excel file)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={config.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={config.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_browser"
                checked={config.show_browser}
                onCheckedChange={(checked) => handleInputChange('show_browser', checked === true)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="show_browser" 
                className="text-sm font-normal cursor-pointer"
              >
                Show browser window during automation (recommended for monitoring progress)
              </Label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Data Processing Details:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Data will be downloaded in {3}-month chunks for optimal performance</li>
              <li>• Insolation values will be automatically divided by {4000}</li>
              <li>• Data will be processed into meter, inverter, and weather station tables</li>
              <li>• CSV files and database records will be generated automatically</li>
            </ul>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Automatic login will be used with pre-configured credentials
            </div>
            <Button
              type="submit"
              disabled={isLoading || !config.monitoring_platform_id.trim()}
              className="bg-[#699B1F] hover:bg-[#699B1F]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Extraction'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}