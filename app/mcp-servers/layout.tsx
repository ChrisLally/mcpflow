import { Metadata } from "next"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "MCP Servers",
  description: "Manage your Model Context Protocol servers",
}

interface MCPServersLayoutProps {
  children: React.ReactNode
}

export default function MCPServersLayout({ children }: MCPServersLayoutProps) {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {children}
      </div>
      <Toaster />
    </>
  )
} 