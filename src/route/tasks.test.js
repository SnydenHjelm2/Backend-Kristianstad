import {test, before, after} from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import {addTask, clearTasks} from "../model/todo.js";

let server;
let baseURL;

before(async () => {
    clearTasks();
    addTask("Go for a walk");
    addTask("Buy groceries");
    addTask("Write code");
    
    await new Promise((resolve) => {
        server = app.listen(0, resolve);
    });

    baseURL = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const sendReq = async (path) => {
    let resp =  await fetch(baseURL + path);
    let contentType = resp.headers.get("content-type") ?? null;
    let reso = contentType.includes("application/json") ? await resp.json() : await resp.text();
    return {
        status: resp.status,
        contentType: contentType,
        reso: reso
    }
}

test("GET /tasks gives all tasks, with id and task", async () => {
    let data = await sendReq("/api/tasks");
    assert.equal(data.status, 200);
    assert.ok(data.contentType.includes("application/json"));
    assert.deepEqual(data.reso, [
        { id: 1, task: 'Go for a walk' },
        { id: 2, task: 'Buy groceries' },
        { id: 3, task: 'Write code' }
    ]);
});

test("GET /tasks/2 gives task with id 2", async () => {
    let data = await sendReq("/api/tasks/2");
    assert.equal(data.status, 200);
    assert.ok(data.contentType.includes("application/json"));
    assert.deepEqual(data.reso, { id: 2, task: 'Buy groceries' });
});

test("task that does not exist return 404", async () => {
    let a = ["40", "70", "6969"];
    for (let n of a) {
        let data = await sendReq("/api/tasks/" + n);
        assert.equal(data.status, 404);
        assert.ok(data.contentType.includes("application/json"));
        assert.deepEqual(typeof data.reso.error, "string");
    }
});

test("invalid id (string, float, negative) returns 400", async () => {
    let a = ["test", "6.7", "-10"];
    for (let n of a) {
        let data = await sendReq("/api/tasks/" + n);
        assert.equal(data.status, 400);
        assert.ok(data.contentType.includes("application/json"));
        assert.deepEqual(typeof data.reso.error, "string");
    }
});