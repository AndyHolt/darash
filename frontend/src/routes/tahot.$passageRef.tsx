import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TahotPassage, TahotPassageError, TahotPassageSkeleton } from "@/components/TahotPassage";
import { passageQuery } from "@/texts/tahot";

export const Route = createFileRoute("/tahot/$passageRef")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(passageQuery(params.passageRef)),
  pendingComponent: TahotPassageSkeleton,
  errorComponent: TahotPassageError,
  component: RouteComponent,
});

function RouteComponent() {
  const { passageRef } = Route.useParams();
  const { data: passage } = useSuspenseQuery(passageQuery(passageRef));

  return <TahotPassage key={passageRef} passage={passage} />;
}
