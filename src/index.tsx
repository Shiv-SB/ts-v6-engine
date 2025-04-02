import { serve } from "bun";
import index from "./index.html";

const server = serve({
    routes: {
        // Serve index.html for all unmatched routes.
        "/*": index,

        "/api/hello": () => new Response("Hello World!"),

        "/api/board/nextmove": {
            POST: (req) => new Response(JSON.stringify({ newBoardState: "foo" }))
        }

    },

    development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
