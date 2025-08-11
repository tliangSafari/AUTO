"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, Calendar, FileSpreadsheet } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AccountData {
  code: string
  startDate: string
  endDate: string
}

interface AccountConfigProps {
  onSubmit: (accounts: AccountData[]) => void
  isLoading?: boolean
}

const DEFAULT_ACCOUNTS: AccountData[] = [
  { code: "401005", startDate: "2025-05-01", endDate: "2025-06-01" },
  { code: "401007", startDate: "2025-05-01", endDate: "2025-06-01" },
  { code: "501012", startDate: "2025-05-01", endDate: "2025-06-01" },
]

export default function AccountConfig({ onSubmit, isLoading = false }: AccountConfigProps) {
  const [accounts, setAccounts] = useState<AccountData[]>([])
  const [newAccount, setNewAccount] = useState<AccountData>({
    code: "",
    startDate: "2025-05-01",
    endDate: "2025-06-01"
  })
  const [useDefaults, setUseDefaults] = useState(true)

  const handleAddAccount = () => {
    if (newAccount.code.trim()) {
      setAccounts([...accounts, { ...newAccount }])
      setNewAccount({
        code: "",
        startDate: newAccount.startDate,
        endDate: newAccount.endDate
      })
    }
  }

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const accountsToSubmit = useDefaults ? DEFAULT_ACCOUNTS : accounts
    onSubmit(accountsToSubmit)
  }

  const formatDateForDisplay = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configure GL Accounts</CardTitle>
        <CardDescription>Set up account codes and date ranges for GL transaction reports</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useDefaults"
                checked={useDefaults}
                onChange={(e) => setUseDefaults(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-[#699B1F] border-gray-300 rounded focus:ring-[#699B1F]"
              />
              <Label htmlFor="useDefaults" className="cursor-pointer">
                Use default account list from Excel
              </Label>
            </div>

            {!useDefaults && (
              <>
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <Label>Add Account</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      placeholder="Account code"
                      value={newAccount.code}
                      onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                      disabled={isLoading}
                    />
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={newAccount.startDate}
                        onChange={(e) => setNewAccount({ ...newAccount, startDate: e.target.value })}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={newAccount.endDate}
                        onChange={(e) => setNewAccount({ ...newAccount, endDate: e.target.value })}
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddAccount}
                      disabled={isLoading || !newAccount.code.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2">
                    <Label>Configured Accounts ({accounts.length})</Label>
                    <ScrollArea className="h-48 border rounded-md p-4">
                      <div className="space-y-2">
                        {accounts.map((account, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline">{account.code}</Badge>
                              <span className="text-sm text-gray-600">
                                {formatDateForDisplay(account.startDate)} - {formatDateForDisplay(account.endDate)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAccount(index)}
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
              <div className="flex items-center space-x-2 mb-3">
                <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Default accounts from Excel:</span>
              </div>
              <div className="space-y-2">
                {DEFAULT_ACCOUNTS.map((account, index) => (
                  <div key={index} className="flex items-center space-x-4 p-2 bg-white rounded border">
                    <Badge variant="secondary">{account.code}</Badge>
                    <span className="text-sm text-gray-600">
                      {formatDateForDisplay(account.startDate)} - {formatDateForDisplay(account.endDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (!useDefaults && accounts.length === 0)}
          >
            {isLoading ? "Processing..." : "Generate Account Reports"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}