import { ChevronLeft } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

export function BackButton(props: ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" size="icon" {...props}>
      <ChevronLeft />
    </Button>
  );
}
