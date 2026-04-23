import { ModeToggle } from "@/components/color-theme/ModeToggle";
import LinkButton from "@/components/LinkButton";

export default function Header() {
  return (
    <>
      <div className="p-2 flex gap-2">
        <LinkButton to="/">Home</LinkButton>
        <LinkButton to="/about">About</LinkButton>
        <LinkButton to="/count">Count</LinkButton>
        <ModeToggle />
      </div>
      <hr />
    </>
  );
}
