import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Button } from "@/components/ui/button";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Button variant="link" asChild>
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </Button>
      <Button variant="link" asChild>
        <Link to="/count" className="[&.active]:font-bold">
          Count
        </Link>
      </Button>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
});
