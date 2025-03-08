'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BrainCircuit, MessageSquareText, Database } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const pathname = usePathname()
  
  const routes = [
    {
      href: '/react-agent',
      label: 'ReAct Agent',
      icon: BrainCircuit,
      description: 'Web search with Tavily API',
    },
    {
      href: '/conversational-rag',
      label: 'Conversational RAG',
      icon: MessageSquareText,
      description: 'Conversation memory with RAG',
    },
    {
      href: '/sql-agent',
      label: 'SQL Agent',
      icon: Database,
      description: 'Query SQL databases',
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-xl font-semibold tracking-tight">
          LangChain Agents
        </h2>
        <p className="text-sm text-muted-foreground">
          Test different agent implementations
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {routes.map((route) => (
            <SidebarMenuItem key={route.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === route.href}
                tooltip={route.description}
              >
                <Link href={route.href}>
                  <route.icon className="mr-2" />
                  <span>{route.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}