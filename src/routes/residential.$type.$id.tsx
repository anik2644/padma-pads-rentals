import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/residential/$type/$id")({
  component: PropertyDetailPlaceholder,
});

function PropertyDetailPlaceholder() {
  const { type, id } = Route.useParams();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Construction className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">Property details — coming next</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The full gallery, map, features, and contact flow ship in the next build. You requested
        the <span className="font-mono text-foreground">{type}</span> listing{" "}
        <span className="font-mono text-foreground">{id}</span>.
      </p>
      <Button asChild variant="outline" className="mt-6 gap-2">
        <Link to="/residential">
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Link>
      </Button>
    </div>
  );
}
