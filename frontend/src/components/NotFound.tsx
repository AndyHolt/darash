import { DEFAULT_CORPUS } from "@/bible/corpora";
import { GoToDefaultPassageButton } from "@/components/GoToDefaultPassageButton";
import Header from "@/components/Header";
import { PassagePicker } from "@/components/PassagePicker";

export function NotFound() {
  return (
    <>
      <Header>
        <PassagePicker corpus={DEFAULT_CORPUS} />
      </Header>
      <div className="flex h-full items-center justify-center p-6 select-none">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1.5">
            <p className="font-display text-5xl font-semibold text-primary">404</p>
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground">
              The page you're looking for doesn't exist.
            </p>
            <p className="text-sm text-muted-foreground">Choose a passage to start reading.</p>
          </div>
          <GoToDefaultPassageButton corpus={DEFAULT_CORPUS} />
        </div>
      </div>
    </>
  );
}
