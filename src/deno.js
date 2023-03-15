import { createRouter } from "@hattip/router";
import { createRequestHandler } from "./adapter-deno.ts";
import { streamMultipart } from "@web3-storage/multipart-parser";
import { parseMultipartFormData } from "@hattip/multipart";
import { serve } from "https://deno.land/std/http/server.ts";

const router = createRouter();

router.get("/", () => new Response("Hello world!"));

router.post("/web3", async (ctx) => {
  const contentType = ctx.request.headers.get("Content-Type") || "";
  const [, boundary] = contentType.split(/\s*;\s*boundary=/);

  const parts = streamMultipart(ctx.request.body, boundary);
  for await (const part of parts) {
    if (part.done) break;
    await Deno.writeFile(
      "web3.bin",
      new ReadableStream({
        async pull(controller) {
          try {
            const { value, done } = await part.data.next();
            if (done) {
              controller.close();
            } else {
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        },
      })
    );
  }

  return new Response("File uploaded!");
});

router.post("/deno", async (ctx) => {
  const fd = await ctx.request.formData();
  const file = fd.get("file");
  Deno.writeFile("deno.bin", file.stream());

  return new Response("File uploaded!");
});

router.post("/hattip", async (ctx) => {
  await parseMultipartFormData(ctx.request, {
    maxFileSize: Infinity,
    maxTotalFileSize: Infinity,
    async handleFile(info) {
      console.log(info);

      /** @type {any} */
      const { body } = info;
      await Deno.writeFile("hattip.bin", body);
    },
  });

  return new Response("File uploaded!");
});

serve(createRequestHandler(router.buildHandler()), { port: 3000 });
