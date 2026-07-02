import { Link } from "@tanstack/react-router";
import type { Corpus } from "@/bible/corpora";
import { formatReference, parseReferenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";

export interface GoToDefaultPassageButtonProps {
  corpus: Corpus;
}

export function GoToDefaultPassageButton({ corpus }: GoToDefaultPassageButtonProps) {
  const label = formatReference(parseReferenceUrlTag(corpus.defaultPassageRef));

  return (
    <Button asChild variant="outline">
      <Link to={corpus.route} params={{ passageRef: corpus.defaultPassageRef }}>
        Go to {label}
      </Link>
    </Button>
  );
}
