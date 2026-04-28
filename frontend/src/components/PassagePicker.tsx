import { useSuspenseQuery } from "@tanstack/react-query";
import { formatReference } from "@/bible/references";
import { passageQuery } from "@/texts/morphgnt";

export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  return (
    <span className="text-sm text-muted-foreground">{formatReference(passage.reference)}</span>
  );
}
