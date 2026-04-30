import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ModeToggle } from "@/components/color-theme/ModeToggle";
import DarashIcon from "@/components/DarashIcon";

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="p-2 grid grid-cols-[1fr_auto_1fr] items-center bg-sidebar">
        <Link to="/" className="flex items-center gap-1.5 justify-self-start">
          <DarashIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display font-semibold text-xl text-primary select-none">Darash</h1>
        </Link>
        {children}
        <div className="justify-self-end">
          <ModeToggle />
        </div>
      </div>
      <hr />
    </>
  );
}
