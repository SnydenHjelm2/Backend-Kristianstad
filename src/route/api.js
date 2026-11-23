import express from "express";

const router = express.Router();

const greetings = {
    en: 'Hello',
    sv: 'Hej',
    de: "Hallo"
}

router.get("/hello", (req, resp) => {
    resp.json({message: "Hello World"});
});

router.get("/hello/:name", (req, resp) => {
    let query = req.query["lang"];
    if (query) {
        query = query.toLowerCase();
        if (!Object.hasOwn(greetings, query)) return resp.status(400).json({error: "Unknown language: " + query});
        resp.json({message: greetings[query] + " " + req.params.name});
    } else resp.json({message: greetings.en + " " + req.params.name});
});

router.get("/languages", (req, resp) => {
    resp.json(Object.keys(greetings));
});

export default router;