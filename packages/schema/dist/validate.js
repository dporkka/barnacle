"use strict";
/**
 * validate.ts — CLI entry-point for PageGraph JSON validation.
 *
 * Usage:
 *   ts-node src/validate.ts <path-to-pagegraph.json>
 *
 * Exit codes:
 *   0 — document is valid
 *   1 — document is invalid or an error occurred
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("./index");
const filePath = process.argv[2];
if (!filePath) {
    console.error("Usage: validate <path-to-pagegraph.json>");
    process.exit(1);
}
const resolved = path.resolve(filePath);
let raw;
try {
    raw = fs.readFileSync(resolved, "utf-8");
}
catch (err) {
    console.error(`Error reading file "${resolved}":`, err.message);
    process.exit(1);
}
let data;
try {
    data = JSON.parse(raw);
}
catch (err) {
    console.error(`Error parsing JSON in "${resolved}":`, err.message);
    process.exit(1);
}
const result = (0, index_1.validatePageGraph)(data);
if (result.valid) {
    console.log(`✓ valid  ${resolved}`);
    process.exit(0);
}
else {
    console.error(`✗ invalid  ${resolved}`);
    for (const error of result.errors) {
        console.error(`  • ${error}`);
    }
    process.exit(1);
}
//# sourceMappingURL=validate.js.map