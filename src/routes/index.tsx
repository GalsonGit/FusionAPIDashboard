import { createFileRoute } from "@tanstack/react-router";
import { Kaufplan } from "@/components/kaufplan";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Kaufplan />;
}
