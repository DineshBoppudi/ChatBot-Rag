"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.log.error(err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
}
