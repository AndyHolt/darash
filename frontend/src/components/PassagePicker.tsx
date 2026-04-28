export interface PassagePickerProps {
  passageRef: string;
}

export function PassagePicker({ passageRef }: PassagePickerProps) {
  return <span className="text-sm text-muted-foreground font-mono">{passageRef}</span>;
}
