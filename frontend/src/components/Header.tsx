import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ModeToggle } from "@/components/color-theme/ModeToggle";
import DarashIcon from "@/components/DarashIcon";

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="p-2 flex justify-between items-center bg-sidebar">
        <Link to="/" className="flex items-center gap-1.5">
          <DarashIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display font-semibold text-xl text-primary select-none">Darash</h1>
        </Link>
        {children}
        <ModeToggle />
      </div>
      <hr />
    </>
  );
}
