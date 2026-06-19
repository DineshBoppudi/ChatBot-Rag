import { Link } from "react-router-dom";
import {
  FaChartBar,
  FaUpload,
  FaDatabase,
  FaRobot,
} from "react-icons/fa";

function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-10">
        AI Data Analyst
      </h1>

      <nav className="flex flex-col gap-4">
        <Link
          to="/"
          className="flex items-center gap-3 p-3 rounded hover:bg-slate-700"
        >
          <FaChartBar />
          Dashboard
        </Link>

        <Link
          to="/upload"
          className="flex items-center gap-3 p-3 rounded hover:bg-slate-700"
        >
          <FaUpload />
          Upload
        </Link>

        <Link
          to="/datasets"
          className="flex items-center gap-3 p-3 rounded hover:bg-slate-700"
        >
          <FaDatabase />
          Datasets
        </Link>

        <Link
          to="/chat"
          className="flex items-center gap-3 p-3 rounded hover:bg-slate-700"
        >
          <FaRobot />
          AI Chat
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar;