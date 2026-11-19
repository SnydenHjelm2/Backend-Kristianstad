import http from "node:http";
import { readFile } from 'node:fs/promises'

export function createApp() {
    return http.createServer(async (req, resp) => {
        if (req.method === "GET") {
            if (req.url === "/") {
                resp.writeHead(200, {"Content-Type": "text/plain; charset=utf-8"});
                resp.end("Hello World!\n");
                return;
            } else if (req.url === "/json") {
                resp.writeHead(200, {"Content-Type": "application/json"});
                resp.end(JSON.stringify({message: "Hello World!"}));
                return;
            } else if (req.url === "/html") {
                resp.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
                resp.end(await readFile("public/index.html"));
                return;
            }
        }

        resp.writeHead(404, {"Content-Type": "text/plain; charset=utf-8"});
        resp.end("Not found\n");
    });
}

