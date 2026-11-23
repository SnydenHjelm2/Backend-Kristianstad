import {test, before, after} from "node:test";
import assert from "node:assert/strict";
import app from "./app.js";

let server;
let baseURL;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, resolve);
    })
    baseURL = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test("GET / responds with Hello World", async () => {
    let resp = await fetch(baseURL + "/");
    assert.equal(resp.status, 200);
    assert.equal(await resp.text(), "Hello World\n");
});

test("GET /api/hello responds with JSON", async () => {
    let resp = await fetch(baseURL + "/api/hello");
    assert.equal(resp.status, 200);
    assert.equal(resp.headers.get("content-type").split(";")[0], "application/json");
    assert.deepEqual(await resp.json(), { message: "Hello World" });
});

test ("GET /nope responds with 404", async () => {
    let resp = await fetch(baseURL + "/nope");
    assert.equal(resp.status, 404);
});

test("GET /api/hello/:name", async () => {
    let resp = await fetch(baseURL + "/api/hello/Gurkan");
    assert.equal(resp.status, 200);
    assert.deepEqual(await resp.json(), { message: "Hello Gurkan" });
});

test("GET /api/hello/:name?lang=sv", async () => {
    let resp = await fetch(baseURL + "/api/hello/Gurkan?lang=sv");
    assert.equal(resp.status, 200);
    assert.deepEqual(await resp.json(), { message: "Hej Gurkan" });
});

test ("GET /api/hello:name?lang=de (Unknown language)", async () => {
    let resp = await fetch(baseURL + "/api/hello/Gurkan?lang=ro");
    assert.equal(resp.status, 400);
    assert.deepEqual(await resp.json(), { error: "Unknown language: ro" });
});

test("GET /api/languages returns array of languages", async () => {
    let resp = await fetch(baseURL + "/api/languages");
    assert.equal(resp.status, 200);
    assert.deepEqual(await resp.json(), [ "en", "sv", "de" ]);
});

test("GET /api/hello/Gurkan?lang=DE case sensitivity check", async () => {
    let resp = await fetch(baseURL + "/api/hello/Gurkan?lang=DE");
    assert.equal(resp.status, 200);
    assert.deepEqual(await resp.json(), { message: "Hallo Gurkan" });
});