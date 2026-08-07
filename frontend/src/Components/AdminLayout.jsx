import AdminSidebar from "./AdminSidebar";
import { Outlet, useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard": { title: "Dashboard", subtitle: "Admin Portal" },
  "/events": { title: "Events", subtitle: "Manage upcoming events" },
  "/registrations": { title: "Registration Management", subtitle: "Review participant registrations" },
  "/analytics": { title: "Analytics", subtitle: "See registrations and event trends" },
  "/settings": { title: "Settings", subtitle: "Manage admin preferences" },
  "/create-event": { title: "Create Event", subtitle: "Add a new event" },
};

function AdminLayout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageMeta = PAGE_TITLES[currentPath] || (currentPath.startsWith("/edit-event") ? { title: "Edit Event", subtitle: "Update event details" } : { title: "Admin Panel", subtitle: "Control center" });

  return (
    <div className="min-h-screen bg-[#f7f8f2] text-[#2b2b2b]">
      <div className="flex flex-col md:flex-row">
        <AdminSidebar />
        <main className="flex-1 min-w-0">
          <div className="border-b border-[#e6e8d9] bg-[#f9f9f2]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 lg:px-10">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7a5c47]">
                  {pageMeta.subtitle}
                </p>
                <h1 className="text-xl font-bold text-[#245c1f]">{pageMeta.title}</h1>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5c4033] shadow-sm ring-1 ring-[#e2e8d5] md:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-[#245c1f]" />
                Admin Dashboard
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6 lg:px-10 lg:py-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
