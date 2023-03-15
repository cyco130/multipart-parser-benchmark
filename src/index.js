// @ts-check
import { createRouter } from "@hattip/router";
import { createMiddleware } from "@hattip/adapter-node";
import { streamMultipart } from "@web3-storage/multipart-parser";
import { parseMultipartFormData } from "@hattip/multipart";
import busboy from "busboy";
import fs from "node:fs";
import { createServer } from "node:http";

const router = createRouter();

router.get("/", () => new Response("Hello world!"));

router.post("/web3", async (ctx) => {
  const contentType = ctx.request.headers.get("Content-Type") || "";
  const [, boundary] = contentType.split(/\s*;\s*boundary=/);

  const parts = streamMultipart(ctx.request.body, boundary);
  for await (const part of parts) {
    if (part.done) break;
    await fs.promises.writeFile("web3.bin", part.data);
  }

  return new Response("File uploaded!");
});

router.post("/hattip", async (ctx) => {
  const fd = await parseMultipartFormData(ctx.request, {
    maxFileSize: Infinity,
    maxTotalFileSize: Infinity,
    async handleFile(info) {
      /** @type {any} */
      const { body } = info;
      await fs.promises.writeFile("hattip.bin", body);
    },
  });

  return new Response("File uploaded!");
});

const hattipMiddleware = createMiddleware(router.buildHandler());

createServer((req, res) => {
  console.log(req.url, req.method);
  if (req.url === "/busboy" && req.method === "POST") {
    const bb = busboy({ headers: req.headers });
    bb.on("file", async (_, file) => {
      await fs.promises.writeFile("busboy.bin", file);
    });

    bb.on("close", () => {
      res.end("File uploaded!");
    });

    req.pipe(bb);
  } else {
    hattipMiddleware(req, res);
  }
}).listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
