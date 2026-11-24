import express from "express";
import apiRouter from "./route/api.js";
import healthRouter from "./route/health.js";
import pageRouter from "./route/page.js";
import path from "node:path";

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dirname, 'views'));

app.use(express.static(path.join(import.meta.dirname, '..', 'public')));

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.use("/", pageRouter);

app.use("/api", apiRouter);

app.use("/api/health", healthRouter);

export default app;