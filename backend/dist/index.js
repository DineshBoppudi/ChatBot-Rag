"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const upload_1 = __importDefault(require("./routes/upload"));
const dataset_routes_1 = __importDefault(require("./routes/dataset.routes"));
const chat_1 = __importDefault(require("./routes/chat"));
const db_1 = require("./db");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', upload_1.default);
app.use('/api/datasets', dataset_routes_1.default);
app.use('/api/chat', chat_1.default);
app.use(errorHandler_1.errorHandler);
const port = process.env.PORT || 4000;
(0, db_1.initDb)().then(() => {
    app.listen(port, () => console.log(`Server listening on ${port}`));
}).catch(err => { console.error(err); process.exit(1); });
