import express from "express";
import os from "node:os";

const router = express.Router();

export function defaultInfo() {
    return {
        status: "ok", 
        time: new Date(), 
        uptime: Math.round(process.uptime())
    }
}

export function memoryInfo() {
    return {
        "heapUsedMb": toMb(process.memoryUsage().heapUsed),
        "heapTotalMb": toMb(process.memoryUsage().heapTotal),
        "rssMb": toMb(process.memoryUsage().rss)
    }
}

export function nodeInfo() {
    return {
        version: process.version,
        platform: process.platform,
        pid: process.ppid
    }
}

export function systemInfo() {
    return {
        hostname: os.hostname(),
        cpus: os.cpus().length,
        freeMemoryMb: toMb(os.freemem()),
        totalMemoryMb: toMb(os.totalmem()),
        loadAverage: os.loadavg()
    }
}

function toMb(b) {
    return Math.round(b / (1024 * 1024));
}

router.get("/", (req, resp) => {
    let obj = defaultInfo();

    if (req.query["details"] === "true") {
        obj.node = nodeInfo();
        obj.memory = memoryInfo();
        obj.system = systemInfo();
    } 
    
    if (req.query["minFreeMb"]) {
        let query = parseInt(req.query["minFreeMb"]);
        let memory = systemInfo();

        if (isNaN(query)) query = Infinity;

        if (memory.freeMemoryMb < query) {
            obj.status = "degraded";
            resp.status(503);
        }
    }

    resp.json(obj);
});

router.get("/node", (req, resp) => {
    resp.json(nodeInfo());
});

router.get("/memory", (req, resp) => {
    resp.json(memoryInfo());
});

router.get("/system", (req, resp) => {
    resp.json(systemInfo());
});

router.get("/:part", (req, resp) => {
    resp.status(404).json({error: "Unknown part: " + req.params["part"]});
});

export default router;