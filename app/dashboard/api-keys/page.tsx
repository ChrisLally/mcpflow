'use client';

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function APIKeysPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys and service integrations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              View and manage your encrypted API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* API keys list will go here */}
            <div className="text-sm text-muted-foreground">
              No API keys found. Click &ldquo;Add API Key&rdquo; to create one.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 