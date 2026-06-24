"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTableName = generateTableName;
function generateTableName(filename) {
    return filename
        .replace(".csv", "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .toLowerCase();
}
