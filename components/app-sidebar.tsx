"use client"

import * as React from "react"
import { HomeIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { mainNavItems } from "./nav-main"

// Convert mainNavItems to the format expected by NavMain
const navMainData = mainNavItems.map(item => ({
  title: item.title,
  url: item.href,
  icon: item.icon,
  items: [
    {
      title: item.title,
      url: item.href,
    },
  ],
}))

// This is sample data for other components
const data = {
  teams: [
    {
      name: "Personal",
      logo: HomeIcon,
      plan: "free",
    },
  ],
  projects: [],
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://github.com/shadcn.png",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
