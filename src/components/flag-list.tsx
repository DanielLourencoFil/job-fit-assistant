import type { FitResult } from "@/lib/types";

/** Shared by the review card (live fit) and saved-application details (snapshot). */
export function FlagList({ fit }: { fit: FitResult }) {
  return (
    <ul className="space-y-1 rounded-md border p-3 text-sm">
      {fit.flags.map((flag) => (
        <li
          key={flag.label}
          className={
            flag.status === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-yellow-700 dark:text-yellow-400"
          }
        >
          {flag.status === "ok" ? "✓" : "⚠"} {flag.label}
        </li>
      ))}
      {fit.flags.length === 0 && (
        <li className="text-muted-foreground">
          No flags — nothing to compare yet.
        </li>
      )}
    </ul>
  );
}
