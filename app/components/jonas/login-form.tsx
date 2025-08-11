"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

interface JonasLoginFormProps {
  onLogin: (credentials: { clientId: string; username: string; password: string }) => void
  isLoading?: boolean
}

export default function JonasLoginForm({ onLogin, isLoading = false }: JonasLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [credentialsLoading, setCredentialsLoading] = useState(true)
  const [credentials, setCredentials] = useState({
    clientId: "",
    username: "",
    password: "",
  })

  // Fetch default credentials from API on component mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch('/api/jonas/credentials')
        const data = await response.json()
        
        if (data.success && data.credentials) {
          setCredentials(data.credentials)
        } else {
          // Fallback credentials if API fails
          setCredentials({
            clientId: "121297",
            username: "SLiu",
            password: "AspenPower123-",
          })
        }
      } catch (error) {
        console.error('Failed to fetch Jonas credentials:', error)
        // Fallback credentials if fetch fails
        setCredentials({
          clientId: "121297",
          username: "SLiu",
          password: "AspenPower123-",
        })
      } finally {
        setCredentialsLoading(false)
      }
    }

    fetchCredentials()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(credentials)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>AM Automation Login</CardTitle>
        <CardDescription>
          {credentialsLoading 
            ? "Loading default credentials..." 
            : "Enter your credentials to access AM Automation system"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
              disabled={isLoading || credentialsLoading}
              required
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              disabled={isLoading || credentialsLoading}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                disabled={isLoading || credentialsLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || credentialsLoading}>
            {credentialsLoading ? "Loading..." : isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}