/**
 * migrate.ts — PageGraph migration placeholder system.
 *
 * Migrations are identified by a composite key "fromVersion->toVersion".
 * When a breaking schema change is introduced, register a MigrationFn here
 * and the migratePageGraph function will apply the appropriate chain.
 */

/** A function that transforms a PageGraph from one version to the next. */
export type MigrationFn = (graph: unknown) => unknown;

/**
 * Registry of migration functions.
 *
 * Key format: `"<fromVersion>-><toVersion>"` (e.g. `"1->2"`).
 * Currently empty — reserved for future schema revisions.
 */
export const migrations: Map<string, MigrationFn> = new Map();

/**
 * Apply the necessary migration chain to bring a PageGraph document from
 * `fromVersion` to `toVersion`.
 *
 * If `fromVersion === toVersion` the document is returned as-is (no-op).
 * If a required migration step is missing a descriptive error is thrown.
 *
 * @param data        - The raw (possibly stale) PageGraph document.
 * @param fromVersion - The schema version declared in the document.
 * @param toVersion   - The target schema version.
 * @returns The migrated document (may be a new object).
 */
export function migratePageGraph(
  data: unknown,
  fromVersion: string,
  toVersion: string
): unknown {
  if (fromVersion === toVersion) {
    // Nothing to do — document is already at the target version.
    return data;
  }

  // Build a simple integer step-chain from fromVersion to toVersion.
  const from = parseInt(fromVersion, 10);
  const to = parseInt(toVersion, 10);

  if (isNaN(from) || isNaN(to)) {
    throw new Error(
      `migratePageGraph: non-numeric versions are not supported ` +
        `(fromVersion="${fromVersion}", toVersion="${toVersion}")`
    );
  }

  if (from > to) {
    throw new Error(
      `migratePageGraph: downgrade from version ${from} to ${to} is not supported`
    );
  }

  let current = data;

  for (let v = from; v < to; v++) {
    const key = `${v}->${v + 1}`;
    const fn = migrations.get(key);
    if (!fn) {
      throw new Error(
        `migratePageGraph: no migration registered for step "${key}". ` +
          `Register a MigrationFn in the migrations map.`
      );
    }
    current = fn(current);
  }

  return current;
}
