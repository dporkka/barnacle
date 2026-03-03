"use strict";
/**
 * @barnacle/schema — PageGraph TypeScript types, validation, and serialization.
 *
 * This module is the single source of truth for the PageGraph v1 data model.
 * It exports TypeScript interfaces that mirror the JSON Schema, an AJV-backed
 * validator, and deterministic serialization helpers.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_VERSION = void 0;
exports.validatePageGraph = validatePageGraph;
exports.serializePageGraph = serializePageGraph;
exports.createEmptyPageGraph = createEmptyPageGraph;
const _2020_1 = __importDefault(require("ajv/dist/2020"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const pagegraph_schema_json_1 = __importDefault(require("./pagegraph.schema.json"));
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/** The current PageGraph schema version. */
exports.SCHEMA_VERSION = "1";
// ---------------------------------------------------------------------------
// AJV validator (compiled once at module load — zero runtime overhead)
// ---------------------------------------------------------------------------
const ajv = new _2020_1.default({
    strict: true,
    allErrors: true,
});
(0, ajv_formats_1.default)(ajv);
const _validate = ajv.compile(pagegraph_schema_json_1.default);
/**
 * Validate an unknown value against the PageGraph v1 JSON Schema.
 *
 * @param data - The value to validate (typically parsed JSON).
 * @returns `{ valid: true, errors: [] }` on success, or `{ valid: false, errors: [...] }`.
 */
function validatePageGraph(data) {
    const valid = _validate(data);
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
function sortKeys(value) {
    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }
    if (value !== null && typeof value === "object") {
        const obj = value;
        return Object.keys(obj)
            .sort()
            .reduce((acc, key) => {
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
function serializePageGraph(graph) {
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
function createEmptyPageGraph(id, slug, title) {
    return {
        id,
        version: exports.SCHEMA_VERSION,
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
//# sourceMappingURL=index.js.map