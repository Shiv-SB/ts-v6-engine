import { serve } from "bun";
import index from "./index.html";

import Engine from "./backend/v6-engine/engine";

const server = serve({
    routes: {
        // Serve index.html for all unmatched routes.
        "/*": index,

        "/api/hello": () => new Response("Hello World!"),

        "/api/board/nextmove": {
            POST: async req => {

                const body = await req.json();
                console.log(Engine.calculateTotalPieceScores(body.boardState));
                return new Response(JSON.stringify({
                    score: Engine.calculateTotalPieceScores(body.boardState)
                }));
            }
        }

    },

    development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
