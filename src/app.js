import express from "express";
import apiRouter from "./route/api.js";
import healthRouter from "./route/health.js";

const app = express();

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.get("/", (req, resp) => {
    resp.send("Hello World\n");
});

app.use("/api", apiRouter);

app.use("/api/health", healthRouter);

export default app;