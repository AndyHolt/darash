import { Link } from "@tanstack/react-router";
import DarashIcon from "./DarashIcon";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  return (
    <footer
      className={`border-t bg-sidebar text-sidebar-foreground text-sm ${className ?? ""}`.trim()}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-row gap-x-1 items-center font-display font-semibold text-primary text-base">
            <DarashIcon className="size-4" />
            <span>Darash</span>
          </div>
          <p className="text-sidebar-muted-foreground">
            Interactive reader for the Greek New Testament.
          </p>
          <p className="text-sidebar-muted-foreground">
            Built with ❤️ by{" "}
            <a
              href="https://andyholt.github.io"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary"
            >
              Andy Holt
            </a>{" "}
            in Dundee, Scotland.
          </p>
        </div>
        <nav className="flex flex-col gap-1 sm:items-end">
          <Link to="/about" className="hover:text-primary [&.active]:font-semibold">
            About
          </Link>
          <Link to="/sources" className="hover:text-primary [&.active]:font-semibold">
            Sources & Data
          </Link>
          <a
            href="https://github.com/AndyHolt/darash"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
