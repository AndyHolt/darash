import { Link } from "@tanstack/react-router";
import { ModeToggle } from "@/components/color-theme/ModeToggle";
import LinkButton from "@/components/LinkButton";

export default function Header() {
  return (
    <>
      <div className="p-2 flex justify-between items-center bg-sidebar">
        <Link to="/" className="flex items-center gap-1.5">
          <img src="/icon-header.svg" alt="" className="h-6 w-6" />
          <h1 className="font-medium text-xl text-primary select-none">Darash</h1>
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
