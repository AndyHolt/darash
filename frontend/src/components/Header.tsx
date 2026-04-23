import { Link } from "@tanstack/react-router";
import { ModeToggle } from "@/components/color-theme/ModeToggle";
import LinkButton from "@/components/LinkButton";

export default function Header() {
  return (
    <>
      <div className="p-2 flex justify-between items-center bg-sidebar">
        <Link to="/">
          <h1 className="font-bold text-2xl text-sidebar-foreground select-none">Darash</h1>
        </Link>
        <div className="flex gap-1">
          <LinkButton to="/about">About</LinkButton>
          <LinkButton to="/count">Count</LinkButton>
          <ModeToggle />
        </div>
      </div>
      <hr />
    </>
  );
}
