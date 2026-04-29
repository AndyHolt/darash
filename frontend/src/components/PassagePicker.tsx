import { useQuery } from "@tanstack/react-query";
import { formatReference } from "@/bible/references";
import { passageQuery } from "@/texts/morphgnt";

export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  const { data: passage } = useQuery(passageQuery(passageRef));

  return (
    <span className="text-sm text-muted-foreground">
      {passage ? formatReference(passage.reference) : "Select passage"}
    </span>
  );
}
