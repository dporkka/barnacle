/**
 * @barnacle/schema — PageGraph TypeScript types, validation, and serialization.
 *
 * This module is the single source of truth for the PageGraph v1 data model.
 * It exports TypeScript interfaces that mirror the JSON Schema, an AJV-backed
 * validator, and deterministic serialization helpers.
 */

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import schema from "./pagegraph.schema.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The current PageGraph schema version. */
export const SCHEMA_VERSION = "1" as const;

// ---------------------------------------------------------------------------
// TypeScript interfaces (mirror the JSON Schema $defs)
// ---------------------------------------------------------------------------

/** Semantic node types supported by the renderer. */
export type NodeType =
  | "section"
  | "container"
  | "heading"
  | "paragraph"
  | "image"
  | "video"
  | "button"
  | "richtext"
  | "columns"
  | "divider";

/** Page-level metadata stored in the PageGraph document. */
export interface PageMeta {
  /** Human-readable page title. */
  title: string;
  /** Short description used in HTML meta tags. */
  description?: string;
  /** URL slug — lowercase alphanumeric with hyphens. */
  slug: string;
  /** BCP-47 language tag (e.g. "en", "fr"). */
  lang?: string;
  /** ISO 8601 publish timestamp. */
  publishedAt?: string;
  /** ISO 8601 last-updated timestamp. */
  updatedAt?: string;
}

/** A single renderable node in the page tree. */
export interface PageNode {
  /** Node identifier — unique within this document. */
  id: string;
  /** Semantic type that drives rendering. */
  type: NodeType;
  /** Node-type-specific properties (text, src, level, href, …). */
  props: Record<string, unknown>;
  /** Ordered list of child node IDs. */
  children: string[];
  /** IDs of StyleDef entries that apply to this node. */
  styleRefs: string[];
  /** ID of the parent node, or null for root-level nodes. */
  parentId: string | null;
}

/** A reusable style definition that maps to a CSS class. */
export interface StyleDef {
  /** Unique style identifier referenced from PageNode.styleRefs. */
  id: string;
  /** CSS class name emitted into the rendered HTML. */
  className: string;
  /** CSS property/value pairs (camelCase keys, string values). */
  css: Record<string, string>;
}

/** A referenced media asset (image, video, font, …). */
export interface AssetDef {
  /** Unique asset identifier. */
  id: string;
  /** Fully-qualified or root-relative URL of the asset. */
  url: string;
  /** MIME type (e.g. "image/png"). */
  mimeType: string;
  /** Content hash for cache-busting. */
  hash: string;
  /** Pixel width — only meaningful for image/video assets. */
  width?: number;
  /** Pixel height — only meaningful for image/video assets. */
  height?: number;
  /** Accessibility alt text for image assets. */
  alt?: string;
}

/** The root PageGraph document. */
export interface PageGraph {
  /** UUID v4 document identifier. */
  id: string;
  /** Schema version — always "1" for this revision. */
  version: typeof SCHEMA_VERSION;
  /** Page-level metadata. */
  meta: PageMeta;
  /** Ordered list of all nodes in the page tree. */
  nodes: PageNode[];
  /** Named style definitions keyed by style ID. */
  styles: Record<string, StyleDef>;
  /** Named asset definitions keyed by asset ID. */
  assets: Record<string, AssetDef>;
}

// ---------------------------------------------------------------------------
// AJV validator (compiled once at module load — zero runtime overhead)
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
});
addFormats(ajv);

const _validate = ajv.compile(schema);

/**
 * Validate an unknown value against the PageGraph v1 JSON Schema.
 *
 * @param data - The value to validate (typically parsed JSON).
 * @returns `{ valid: true, errors: [] }` on success, or `{ valid: false, errors: [...] }`.
 */
export function validatePageGraph(data: unknown): {
  valid: boolean;
  errors: string[];
} {
  const valid = _validate(data) as boolean;
  if (valid) {
    return { valid: true, errors: [] };
  }
  const errors = (_validate.errors ?? []).map((e) => {
    const path = e.instancePath || "(root)";
    return `${path}: ${e.message ?? "unknown error"}`;
  });
  return { valid: false, errors };
}

// ---------------------------------------------------------------------------
// Deterministic serialization
// ---------------------------------------------------------------------------

/**
 * Recursively sort the keys of a plain object so that serialization is
 * deterministic regardless of insertion order.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Serialize a PageGraph to a deterministic JSON string.
 *
 * Keys are sorted recursively so that two semantically-equal PageGraph objects
 * always produce the same bytes — suitable for content hashing and diffs.
 *
 * @param graph - A valid PageGraph object.
 * @returns Pretty-printed JSON with sorted keys and 2-space indentation.
 */
export function serializePageGraph(graph: PageGraph): string {
  return JSON.stringify(sortKeys(graph), null, 2);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a minimal valid empty PageGraph.
 *
 * @param id    - UUID v4 document identifier.
 * @param slug  - URL slug for the page.
 * @param title - Human-readable page title.
 */
export function createEmptyPageGraph(
  id: string,
  slug: string,
  title: string
): PageGraph {
  return {
    id,
    version: SCHEMA_VERSION,
    meta: {
      title,
      slug,
      lang: "en",
    },
    nodes: [],
    styles: {},
    assets: {},
  };
}
