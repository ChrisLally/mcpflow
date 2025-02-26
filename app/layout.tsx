"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { SupabaseProvider } from "@/components/providers/supabase-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <SidebarProvider>
            <div className="relative flex min-h-screen">
              <AppSidebar />
              <div className="flex-1">
                <main className="relative flex min-h-screen flex-col">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
