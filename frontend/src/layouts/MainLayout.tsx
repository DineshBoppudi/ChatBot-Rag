import { ReactNode } from "react";
import Sidebar from "../components/Sidebar";

type Props = {
  children: ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-8 bg-slate-100 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;