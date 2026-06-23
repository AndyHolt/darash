import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  MorphgntPassage,
  MorphgntPassageError,
  MorphgntPassageSkeleton,
} from "@/components/MorphgntPassage";
import { passageQuery } from "@/texts/morphgnt";

export const Route = createFileRoute("/sblgnt/$passageRef")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(passageQuery(params.passageRef)),
  pendingComponent: MorphgntPassageSkeleton,
  errorComponent: MorphgntPassageError,
  component: RouteComponent,
});

function RouteComponent() {
  const { passageRef } = Route.useParams();
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  return <MorphgntPassage key={passageRef} passage={passage} />;
}
