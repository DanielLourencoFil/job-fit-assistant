import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/lib/types";

const STYLES: Record<Verdict, string> = {
  good: "bg-green-100 text-green-800 border-green-300",
  stretch: "bg-yellow-100 text-yellow-800 border-yellow-300",
  skip: "bg-red-100 text-red-800 border-red-300",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <Badge variant="outline" className={`uppercase ${STYLES[verdict]}`}>
      {verdict}
    </Badge>
  );
}
