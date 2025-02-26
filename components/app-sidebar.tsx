"use client"

import * as React from "react"
import {
  SquareTerminal,
  KeyIcon,
  HomeIcon,
} from "lucide-react"

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

// This is sample data.
const data = {
  teams: [
    {
      name: "Personal",
      logo: HomeIcon,
      plan: "free",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: HomeIcon,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
      ],
    },
    {
      title: "API Management",
      url: "/dashboard/api-keys",
      icon: KeyIcon,
      items: [
        {
          title: "API Keys",
          url: "/dashboard/api-keys",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Project 1",
      url: "/projects/1",
      icon: SquareTerminal,
    },
  ],
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
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
