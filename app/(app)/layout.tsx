import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="grid h-screen w-screen grid-rows-[minmax(0,1fr)] overflow-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col h-full w-full pb-16 md:pb-0">
          <TopNav />
          <ScrollArea className="flex-1 w-full min-h-0">
            <main className="w-full max-w-screen flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </ScrollArea>
        </div>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
