import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { Navbar } from '@/components/common/Navbar';
import { ProjectTabBar } from '@/components/common/ProjectTabBar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen antialiased transition-colors duration-200 bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#090d16]">
        <Navbar />
        <ProjectTabBar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto bg-slate-100 dark:bg-[#090d16]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
