import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff4ff,transparent_36%),linear-gradient(135deg,#f8fbff,#fff1f7)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,#12385d,transparent_34%),linear-gradient(135deg,#07111f,#111827)] dark:text-white">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
          <Topbar />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
