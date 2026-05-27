import { createFileRoute, Outlet } from "@tanstack/react-router";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
