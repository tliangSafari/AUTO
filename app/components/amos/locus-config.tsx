"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface LocusConfig {
  site_name: string
  start_date: string
  end_date: string
  email: string
  password: string
  show_browser: boolean
}

interface LocusConfigProps {
  onSubmit: (config: LocusConfig) => void
  isLoading?: boolean
}

export default function LocusConfig({ onSubmit, isLoading = false }: LocusConfigProps) {
  const [config, setConfig] = useState<LocusConfig>({
    site_name: 'USG1',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    email: 'jhao@aspenpower.com',
    password: 'Aspen2025',
    show_browser: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(config)
  }

  const handleInputChange = (field: keyof LocusConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Locus Energy Configuration</CardTitle>
        <CardDescription>
          Configure the parameters for Locus Energy data extraction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                type="text"
                value={config.site_name}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                placeholder="e.g., USG1"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                The site identifier in Locus Energy system
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

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Login email for Locus Energy platform
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Your password"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Login password for Locus Energy platform
              </p>
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

          <div className="flex justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Data will be extracted in weekly chunks for optimal performance
            </div>
            <Button
              type="submit"
              disabled={isLoading}
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