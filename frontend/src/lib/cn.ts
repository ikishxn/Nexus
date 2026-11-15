/**
 * Joins truthy class name fragments. Deliberately minimal (no clsx/twMerge
 * dependency) — pass conditionally computed strings in and this filters
 * out `false` / `null` / `undefined` / empty-string entries.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
