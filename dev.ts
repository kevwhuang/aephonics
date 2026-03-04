import { watch } from "fs";
import { resolve } from "path";
import { exec } from "child_process";

const PORT = 10000;
const dir = process.cwd();
const arg = process.argv[2];
const file = arg
    ? (await Bun.file(`${arg}.html`).exists())
        ? `${arg}.html`
        : arg
    : [...new Bun.Glob("*.html").scanSync(dir)][0];

if (!file) {
    console.error("No HTML file found");
    process.exit(1);
}

const clients = new Set<WebSocket>();

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const { pathname } = new URL(req.url);

        if (pathname === "/_ws") {
            return server.upgrade(req)
                ? undefined
                : new Response(null, { status: 400 });
        }

        const target =
            pathname === "/" || pathname === `/${file}`
                ? file
                : pathname.slice(1);

        const f = Bun.file(resolve(dir, target));
        if (!(await f.exists())) return new Response(null, { status: 404 });

        if (target === file) {
            const html = (await f.text()).replace(
                "</head>",
                `<script>(()=>{const w=new WebSocket("ws://localhost:${PORT}/_ws");w.onmessage=()=>location.reload();w.onclose=()=>setTimeout(()=>location.reload(),1e3)})()</script></head>`,
            );
            return new Response(html, {
                headers: { "Content-Type": "text/html" },
            });
        }

        return new Response(f);
    },
    websocket: {
        open(ws) {
            clients.add(ws);
        },
        close(ws) {
            clients.delete(ws);
        },
        message() {},
    },
});

watch(dir, { recursive: true }, (_, f) => {
    if (f && !f.startsWith(".")) {
        console.log(
            `\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m \x1b[36m${f}\x1b[0m`,
        );
        clients.forEach((c) => c.send("r"));
    }
});

console.log(
    `\n  \x1b[32m✓\x1b[0m \x1b[36m${file}\x1b[0m → \x1b[1mhttp://localhost:${PORT}\x1b[0m\n`,
);

exec(
    process.platform === "win32"
        ? `start chrome http://localhost:${PORT}`
        : process.platform === "darwin"
          ? `open -a "Google Chrome" http://localhost:${PORT}`
          : `google-chrome http://localhost:${PORT}`,
);
