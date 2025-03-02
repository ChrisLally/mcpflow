'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Temporary DateRangePicker component until we create a proper one
const DateRangePicker = ({ 
  value, 
  onChange 
}: { 
  value: { from: Date; to: Date } | null; 
  onChange: (value: { from: Date; to: Date } | null) => void 
}) => {
  return (
    <div className="flex space-x-2">
      <input
        type="date"
        className="px-3 py-2 border rounded-md"
        value={value?.from ? value.from.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const from = e.target.value ? new Date(e.target.value) : new Date()
          const to = value?.to || new Date()
          onChange({ from, to })
        }}
      />
      <input
        type="date"
        className="px-3 py-2 border rounded-md"
        value={value?.to ? value.to.toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const to = e.target.value ? new Date(e.target.value) : new Date()
          const from = value?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          onChange({ from, to })
        }}
      />
    </div>
  )
}

interface ApiUsage {
  id: string
  server_id: string
  server_name: string
  timestamp: string
  endpoint: string
  method: string
  status: number
  response_time: number
}

interface ServerItem {
  id: string
  name: string
}

// Define a type for the database response item
interface ApiUsageDbItem {
  id: string;
  server_id: string;
  servers?: {
    name: string;
  };
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  response_time: number;
}

export default function UsagePage() {
  const supabase = useSupabase()
  const [usageData, setUsageData] = useState<ApiUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [serverFilter, setServerFilter] = useState<string | null>(null)
  const [servers, setServers] = useState<ServerItem[]>([])
  const [dateRange, setDateRange] = useState<{from: Date, to: Date} | null>(null)

  const loadUsageData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Build query with filters
      let query = supabase
        .from('_api_usage')
        .select(`
          id,
          server_id,
          servers:_server_configs(name),
          timestamp,
          endpoint,
          method,
          status,
          response_time
        `)
        .order('timestamp', { ascending: false })
        .limit(100)
      
      // Apply filters if set
      if (serverFilter) {
        query = query.eq('server_id', serverFilter)
      }
      
      if (dateRange) {
        query = query
          .gte('timestamp', dateRange.from.toISOString())
          .lte('timestamp', dateRange.to.toISOString())
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Transform data to match our interface
      const formattedData = data?.map((item: ApiUsageDbItem) => ({
        id: item.id,
        server_id: item.server_id,
        server_name: item.servers?.name || 'Unknown',
        timestamp: item.timestamp,
        endpoint: item.endpoint,
        method: item.method,
        status: item.status,
        response_time: item.response_time
      })) || []
      
      setUsageData(formattedData)
    } catch (error) {
      console.error('Error loading usage data:', error)
      if (error instanceof Error) {
        toast.error('Error loading usage data', {
          description: error.message
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, serverFilter, dateRange])

  const loadServers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('_server_configs')
        .select('id, name')
      
      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error loading servers:', error)
    }
  }, [supabase])

  const handleExport = () => {
    // Convert usage data to CSV
    const headers = ['Server', 'Timestamp', 'Endpoint', 'Method', 'Status', 'Response Time (ms)']
    const csvData = usageData.map(item => [
      item.server_name,
      new Date(item.timestamp).toLocaleString(),
      item.endpoint,
      item.method,
      item.status.toString(),
      item.response_time.toString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `api-usage-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    loadServers()
    loadUsageData()
  }, [loadServers, loadUsageData])

  // Calculate analytics
  const totalCalls = usageData.length
  const errorRate = usageData.length > 0 
    ? (usageData.filter(item => item.status >= 400).length / usageData.length) * 100 
    : 0
  const avgResponseTime = usageData.length > 0
    ? usageData.reduce((sum, item) => sum + item.response_time, 0) / usageData.length
    : 0

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage & Monitoring</h1>
          <p className="text-muted-foreground">
            Track API usage and server performance
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              In selected time period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Status codes 4xx and 5xx
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)} ms</div>
            <p className="text-xs text-muted-foreground">
              Across all endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter API usage data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label className="text-sm font-medium">Server</label>
            <Select
              value={serverFilter || ''}
              onValueChange={(value) => setServerFilter(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Servers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Servers</SelectItem>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-2/3">
            <label className="text-sm font-medium">Date Range</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Logs</CardTitle>
          <CardDescription>
            Recent API calls and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-muted-foreground">Loading usage data...</div>
            </div>
          ) : usageData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-muted-foreground">No usage data available</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.server_name}</TableCell>
                    <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{item.endpoint}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.method === 'GET' ? 'secondary' :
                          item.method === 'POST' ? 'default' :
                          item.method === 'PUT' ? 'outline' :
                          item.method === 'DELETE' ? 'destructive' : 'outline'
                        }
                      >
                        {item.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status < 300 ? 'default' :
                          item.status < 400 ? 'secondary' :
                          item.status < 500 ? 'outline' : 'destructive'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.response_time} ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 