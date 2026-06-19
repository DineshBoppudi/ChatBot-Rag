import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import DatasetsPage from "./pages/DatasetsPage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/upload"
            element={<UploadPage />}
          />

          <Route
            path="/datasets"
            element={<DatasetsPage />}
          />

          <Route
            path="/chat"
            element={<ChatPage />}
          />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;