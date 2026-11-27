import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiRouter } from "./api.js";

const app = express();
const directory = path.dirname(fileURLToPath(import.meta.url));
app.use("/api", createApiRouter());
app.use(express.static(path.resolve(directory,"../dist")));
app.use((_req,res) => res.sendFile(path.resolve(directory,"../dist/index.html")));
app.listen(Number(process.env.PORT || 3000), () => console.log(`Clínica Maró disponible en http://localhost:${process.env.PORT || 3000}`));
