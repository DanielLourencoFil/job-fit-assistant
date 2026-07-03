import { Badge } from "@/components/ui/badge";
import type { FitResult, Verdict } from "@/lib/types";

const STYLES: Record<Verdict, string> = {
  good: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  stretch:
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  skip: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

/** "82% · apply" for scored fits; legacy snapshots without a score show the verdict. */
export function VerdictBadge({ fit }: { fit: FitResult }) {
  const label =
    fit.score !== undefined && fit.recommendation
      ? `${fit.score}% · ${fit.recommendation}`
      : fit.verdict;
  return (
    <Badge variant="outline" className={`uppercase ${STYLES[fit.verdict]}`}>
      {label}
    </Badge>
  );
}
