import { NavLink } from "react-router-dom";
import {
  FaChartBar,
  FaUpload,
  FaDatabase,
  FaRobot,
} from "react-icons/fa";

function Sidebar() {
  return (
    <aside className="w-72 sidebar min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold">AI</div>
        <div>
          <h1 className="text-lg font-semibold">AI Data Analyst</h1>
          <p className="text-sm text-muted">Insights · Datasets · Chat</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `sidebar-link px-3 py-2 rounded-md ${isActive ? 'active' : ''}`
          }
        >
          <FaChartBar />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `sidebar-link px-3 py-2 rounded-md ${isActive ? 'active' : ''}`
          }
        >
          <FaUpload />
          <span>Upload</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `sidebar-link px-3 py-2 rounded-md ${isActive ? 'active' : ''}`
          }
        >
          <FaRobot />
          <span>AI Chat</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;