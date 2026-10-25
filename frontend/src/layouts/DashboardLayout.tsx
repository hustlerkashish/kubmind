import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { Navbar } from '@/components/common/Navbar';
import { ProjectTabBar } from '@/components/common/ProjectTabBar';
import { GlobalCopilotDrawer } from '@/components/copilot/GlobalCopilotDrawer';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen antialiased transition-colors duration-200 bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#090d16]">
        <Navbar />
        <ProjectTabBar />
        <main className="flex-1 px-6 py-6 md:px-8 md:py-8 w-full max-w-[1600px] mx-auto bg-slate-100 dark:bg-[#090d16]">
          <Outlet />
        </main>
      </div>

      {/* Global AI Copilot Slide-Over Drawer & Floating Trigger Button */}
      <GlobalCopilotDrawer />
    </div>
  );
}
