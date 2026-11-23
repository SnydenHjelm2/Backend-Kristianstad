import {test, before, after} from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";

let server;
let baseURL;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, resolve);
    });
    baseURL = "http://localhost:" + server.address().port;
});

after(() => server.close());

test("GET /api/health", async () => {
    let resp = await fetch(baseURL + "/api/health");
    assert.equal(resp.status, 200);
    let reso = await resp.json();
    assert.equal(reso.status, "ok");
    assert.ok(!Number.isNaN(Date.parse(reso.time)));
});

test("uptime is a number of seconds", async () => {
    let resp = await fetch(baseURL + "/api/health");
    assert.equal(resp.status, 200);
    let reso = await resp.json();
    assert.equal("number", typeof reso.uptime);
    assert.ok(reso.uptime >= 0);
});

test("GET /api/health/memory gives the memory in MB", async () => {
    let resp = await fetch(baseURL + "/api/health/memory");
    assert.equal(resp.status, 200);
    let reso = await resp.json();
    assert.equal("number", typeof reso.heapUsedMb);
    assert.ok(reso.rssMb > 0);
});

test("an unknown part gives 404", async () => {
    let resp = await fetch(baseURL + "/api/health/test");
    assert.equal(resp.status, 404);
    assert.deepEqual(await resp.json(), { error: "Unknown part: test" });
});

test("?details=true gives all the parts", async () => {
    let resp = await fetch(baseURL + "/api/health?details=true");
    assert.equal(resp.status, 200);
    let reso = await resp.json();
    assert.deepEqual(Object.keys(reso), [ "status", "time", "uptime", "node", "memory", "system" ]);
});

test("?minFreeMb=50 (enough free MB)", async () => {
    let resp = await fetch(baseURL + "/api/health?minFreeMb=50");
    assert.equal(resp.status, 200);
    let reso = await resp.json();
    assert.equal(reso.status, "ok");
});

test("?minFreeMb=Infinity (NOT enough free MB)", async () => {
    let resp = await fetch(baseURL + "/api/health?minFreeMb=Infinity");
    assert.equal(resp.status, 503);
    let reso = await resp.json();
    assert.equal(reso.status, "degraded");
});