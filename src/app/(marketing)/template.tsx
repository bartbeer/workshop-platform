import type { ReactNode } from "react";

/**
 * Remount marketing pages on client navigatie zodat Server Components en client widgets
 * (o.a. hero) niet een verouderde shell tonen na terugkeren van andere routes.
 */
export default function MarketingTemplate({ children }: { children: ReactNode }) {
  return children;
}
