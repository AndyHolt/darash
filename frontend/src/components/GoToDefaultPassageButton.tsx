import { Link } from "@tanstack/react-router";
import { formatReference, parseReferenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";
import { DEFAULT_PASSAGE_REF } from "@/texts/morphgnt";

const DEFAULT_PASSAGE_LABEL = formatReference(parseReferenceUrlTag(DEFAULT_PASSAGE_REF));

export function GoToDefaultPassageButton() {
  return (
    <Button asChild variant="outline">
      <Link to="/sblgnt/$passageRef" params={{ passageRef: DEFAULT_PASSAGE_REF }}>
        Go to {DEFAULT_PASSAGE_LABEL}
      </Link>
    </Button>
  );
}
