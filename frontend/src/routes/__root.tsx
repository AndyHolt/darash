import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import LinkButton from "@/components/LinkButton";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <LinkButton to="/">Home</LinkButton>
      <LinkButton to="/about">About</LinkButton>
      <LinkButton to="/count">Count</LinkButton>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});
