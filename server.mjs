import { H3, defineEventHandler, getQuery } from "h3";
import { toNodeHandler } from "h3/node";
import { createServer } from "node:http";
import { pipeline } from "node:stream";
import { nodeSlowConsumer, nodeStream, webStream } from "./streams.mjs";

const app = new H3();

app.get(
	"/stream",
	defineEventHandler((event) => {
		console.log("GET", event.url.pathname + event.url.search);
		const query = getQuery(event);
		const error = Boolean(query.error)
		return query.type === "web" ? webStream(error) : nodeStream(error);
	})
)

app.post(
	"/stream",
	defineEventHandler(async (event) => {
		console.log("GET", event.url.pathname + event.url.search);
		const query = getQuery(event);
		const error = Boolean(query.error);
		const stream = query.type === "web" ? event.req.body : event.runtime.node.req;
		return await new Promise((resolve, reject) => {
			pipeline(stream, nodeSlowConsumer(error), (err) => {
				if (err) {
					console.log("stream error", err)
					resolve(err);
				} else {
					console.log("stream done")
					resolve(null);
				}
			})
		});
	})
)

createServer(toNodeHandler(app)).listen(process.env.PORT || 3000);
