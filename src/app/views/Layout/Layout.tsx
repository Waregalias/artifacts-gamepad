import { SidebarProvider, SidebarTrigger } from "@/app/components/ui/sidebar"
import { AppSidebar } from "@/app/components/app-sidebar.tsx"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
