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
export declare const migrations: Map<string, MigrationFn>;
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
export declare function migratePageGraph(data: unknown, fromVersion: string, toVersion: string): unknown;
//# sourceMappingURL=migrate.d.ts.map