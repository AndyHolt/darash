import { Link } from "@tanstack/react-router";
import { formatReference, parseReferenceUrlTag } from "@/bible/references";
import { Button } from "@/components/ui/button";
import { HttpError } from "@/lib/http-error";
import { DEFAULT_PASSAGE_REF } from "@/texts/morphgnt";

const DEFAULT_PASSAGE_LABEL = formatReference(parseReferenceUrlTag(DEFAULT_PASSAGE_REF));

export interface MorphgntPassageErrorProps {
  error: Error;
}

interface ErrorContent {
  title: string;
  description: string;
}

function errorContent(error: Error): ErrorContent {
  if (error instanceof HttpError && error.status === 400) {
    return {
      title: "That passage reference isn't valid",
      description: "The reference in the URL couldn't be understood. Pick a passage to continue.",
    };
  }
  if (error instanceof HttpError && error.status === 404) {
    return {
      title: "Passage not found",
      description: "There's no MorphGNT data for that reference. Pick another passage to continue.",
    };
  }
  return {
    title: "Couldn't load passage",
    description: `Something went wrong loading this passage (${error.message}).`,
  };
}

export function MorphgntPassageError({ error }: MorphgntPassageErrorProps) {
  const { title, description } = errorContent(error);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/sblgnt/$passageRef" params={{ passageRef: DEFAULT_PASSAGE_REF }}>
            Go to {DEFAULT_PASSAGE_LABEL}
          </Link>
        </Button>
      </div>
    </div>
  );
}
