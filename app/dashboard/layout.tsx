import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your MCPflow settings and resources",
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  )
} 