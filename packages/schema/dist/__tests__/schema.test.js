"use strict";
/**
 * schema.test.ts — Jest unit tests for @barnacle/schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const migrate_1 = require("../migrate");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Build a minimal valid PageGraph for testing. */
function makeValid() {
    return {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: "1",
        meta: {
            title: "Test Page",
            slug: "test-page",
            lang: "en",
        },
        nodes: [
            {
                id: "node-1",
                type: "section",
                props: {},
                children: [],
                styleRefs: [],
                parentId: null,
            },
        ],
        styles: {},
        assets: {},
    };
}
// ---------------------------------------------------------------------------
// validatePageGraph
// ---------------------------------------------------------------------------
describe("validatePageGraph", () => {
    test("accepts a minimal valid PageGraph", () => {
        const result = (0, index_1.validatePageGraph)(makeValid());
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    test("rejects a document missing required top-level fields", () => {
        const bad = { id: "123e4567-e89b-12d3-a456-426614174000" };
        const result = (0, index_1.validatePageGraph)(bad);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
    test("rejects a document with a wrong version value", () => {
        const bad = { ...makeValid(), version: "99" };
        const result = (0, index_1.validatePageGraph)(bad);
        expect(result.valid).toBe(false);
    });
    test("rejects a node with an unknown type", () => {
        const graph = makeValid();
        // Force an invalid type to test enum validation
        graph.nodes[0].type = "carousel";
        const result = (0, index_1.validatePageGraph)(graph);
        expect(result.valid).toBe(false);
    });
    test("rejects a document with an invalid slug", () => {
        const graph = makeValid();
        graph.meta.slug = "INVALID SLUG!";
        const result = (0, index_1.validatePageGraph)(graph);
        expect(result.valid).toBe(false);
    });
    test("rejects when nodes is not an array", () => {
        const bad = { ...makeValid(), nodes: "not-an-array" };
        const result = (0, index_1.validatePageGraph)(bad);
        expect(result.valid).toBe(false);
    });
    test("accepts a PageGraph with a complete asset definition", () => {
        const graph = makeValid();
        graph.assets["img-1"] = {
            id: "img-1",
            url: "https://example.com/photo.jpg",
            mimeType: "image/jpeg",
            hash: "abc123",
            width: 800,
            height: 600,
            alt: "A photo",
        };
        const result = (0, index_1.validatePageGraph)(graph);
        expect(result.valid).toBe(true);
    });
    test("rejects an asset with an invalid URI", () => {
        const graph = makeValid();
        graph.assets["bad-asset"] = {
            id: "bad-asset",
            url: "not a uri",
            mimeType: "image/jpeg",
            hash: "abc123",
        };
        const result = (0, index_1.validatePageGraph)(graph);
        expect(result.valid).toBe(false);
    });
});
// ---------------------------------------------------------------------------
// serializePageGraph
// ---------------------------------------------------------------------------
describe("serializePageGraph", () => {
    test("produces deterministic output when called twice", () => {
        const graph = makeValid();
        expect((0, index_1.serializePageGraph)(graph)).toBe((0, index_1.serializePageGraph)(graph));
    });
    test("produces the same output regardless of object key insertion order", () => {
        const g1 = makeValid();
        // Build a graph with deliberately reversed key order
        const g2 = {
            assets: {},
            styles: {},
            nodes: [
                {
                    styleRefs: [],
                    children: [],
                    props: {},
                    type: "section",
                    id: "node-1",
                    parentId: null,
                },
            ],
            meta: { slug: "test-page", title: "Test Page", lang: "en" },
            version: "1",
            id: "123e4567-e89b-12d3-a456-426614174000",
        };
        expect((0, index_1.serializePageGraph)(g1)).toBe((0, index_1.serializePageGraph)(g2));
    });
    test("output is valid JSON", () => {
        const graph = makeValid();
        const json = (0, index_1.serializePageGraph)(graph);
        expect(() => JSON.parse(json)).not.toThrow();
    });
});
// ---------------------------------------------------------------------------
// createEmptyPageGraph
// ---------------------------------------------------------------------------
describe("createEmptyPageGraph", () => {
    test("produces a valid PageGraph", () => {
        const graph = (0, index_1.createEmptyPageGraph)("123e4567-e89b-12d3-a456-426614174000", "home", "Home");
        const result = (0, index_1.validatePageGraph)(graph);
        expect(result.valid).toBe(true);
    });
    test("sets id, slug, and title correctly", () => {
        const id = "123e4567-e89b-12d3-a456-426614174001";
        const graph = (0, index_1.createEmptyPageGraph)(id, "about-us", "About Us");
        expect(graph.id).toBe(id);
        expect(graph.meta.slug).toBe("about-us");
        expect(graph.meta.title).toBe("About Us");
    });
    test("starts with an empty nodes array", () => {
        const graph = (0, index_1.createEmptyPageGraph)("123e4567-e89b-12d3-a456-426614174002", "empty", "Empty");
        expect(graph.nodes).toEqual([]);
    });
});
// ---------------------------------------------------------------------------
// migratePageGraph
// ---------------------------------------------------------------------------
describe("migratePageGraph", () => {
    test("same-version migration is a no-op (returns identical reference)", () => {
        const graph = makeValid();
        const result = (0, migrate_1.migratePageGraph)(graph, "1", "1");
        expect(result).toBe(graph);
    });
    test("throws when no migration path exists", () => {
        const graph = makeValid();
        expect(() => (0, migrate_1.migratePageGraph)(graph, "1", "2")).toThrow();
    });
});
//# sourceMappingURL=schema.test.js.map