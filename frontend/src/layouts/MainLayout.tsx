import { ReactNode } from "react";
import Sidebar from "../components/Sidebar";

type Props = {
  children: ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-50">

      <Sidebar />

      <main className="flex-1 overflow-auto">
       <div className="p-5">
          {children}
        </div>
      </main>

    </div>
  );
}

export default MainLayout;