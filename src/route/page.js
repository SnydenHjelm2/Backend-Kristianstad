import express from "express";
import { defaultInfo, nodeInfo, memoryInfo, systemInfo } from "./health.js";

const router = express.Router();

router.get("/", (req, resp) => {
    resp.render("index", {title: "yoyo"});
});

router.get("/hello", (req, resp) => {
    let query = req.query["name"] ?? "World";
    resp.render("hello", {title: "yoyo " + query, name: query});
});

router.get("/health", (req, resp) => {
    let obj = defaultInfo();
    obj.node = nodeInfo();
    obj.memory = memoryInfo();
    obj.system = systemInfo();
    resp.render("health", {title: "health", data: obj});
});

export default router;