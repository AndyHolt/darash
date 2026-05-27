import { Link } from "@tanstack/react-router";

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
          <p className="font-display font-semibold text-primary text-base">Darash</p>
          <p className="text-sidebar-muted-foreground">A Biblical Greek study app.</p>
          <p className="text-sidebar-muted-foreground">
            Greek text from the{" "}
            <a
              href="https://morphgnt.org"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-primary"
            >
              MorphGNT/SBLGNT
            </a>{" "}
            project.
          </p>
        </div>
        <nav className="flex flex-col gap-1 sm:items-end">
          <Link to="/about" className="hover:text-primary [&.active]:font-semibold">
            About
          </Link>
          <Link to="/sources" className="hover:text-primary [&.active]:font-semibold">
            Sources
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
