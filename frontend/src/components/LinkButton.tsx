import { Link } from "@tanstack/react-router";
import type React from "react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

interface LinkButtonProps {
  to: ComponentProps<typeof Link>["to"];
  children: React.ReactNode;
}

export default function LinkButton({ to, children }: LinkButtonProps) {
  return (
    <Button variant="link" asChild>
      <Link to={to} className="[&.active]:font-bold">
        {children}
      </Link>
    </Button>
  );
}
