import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Upload,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="w-72 sidebar min-h-screen flex flex-col">

      <div className="px-8 py-8">
        <h1 className="text-xl font-bold tracking-wide">
          DATA PLATFORM
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Analytics & AI Insights
        </p>
      </div>

      <div className="px-5">

        <p className="uppercase text-xs text-slate-500 mb-4 tracking-widest">
          Navigation
        </p>

        <nav className="space-y-2">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <LayoutGrid size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Upload size={18} />
            Upload Dataset
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <MessageSquare size={18} />
            AI Analytics
          </NavLink>

        </nav>

      </div>

      <div className="mt-auto p-5">

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">

          <div className="flex gap-3">

            <HelpCircle
              size={20}
              className="text-indigo-400"
            />

            <div>
              <h3 className="text-white font-semibold">
                Need Help?
              </h3>

              <p className="text-slate-400 text-sm mt-2">
                Ask AI to generate insights,
                summaries and SQL queries.
              </p>
            </div>

          </div>

        </div>

      </div>

    </aside>
  );
}

export default Sidebar;