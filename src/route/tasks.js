import express from "express";
import {getTaskList, getTask} from "../model/todo.js";

const router = express.Router();

router.get("/", (req, resp) => {
    resp.json(getTaskList());
});

router.get("/:id", (req, resp) => {
    let param = parseFloat(req.params["id"]);

    if (isNaN(param)) return resp.status(400).json({error: "id param is NaN"});

    if (param % 1 !== 0 || Object.is(param % 1, -0)) return resp.status(400).json({error: "id not a whole number or negative"});

    let task = getTask(param);
    if (!task) return resp.status(404).json({error: "no task with that id"});

    resp.json(task);
});

export default router;