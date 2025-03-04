import { createApp, createRouter, defineEventHandler, toNodeListener, getQuery, getRequestWebStream } from "h3";
import { createServer } from "node:http";
import { pipeline } from "node:stream";
import { nodeSlowConsumer, nodeStream, webStream } from "./streams.mjs";

const app = createApp();
const router = createRouter();
app.use(router);

router.get(
	"/stream",
	defineEventHandler((event) => {
		console.log("GET", event.path)
		const query = getQuery(event);
		const error = Boolean(query.error)
		const stream = query.type === "web" ? webStream(error) : nodeStream(error);
		if (query.raw) {
			pipeline(stream, event.node.res, (err) => {
				if (err) {
					console.log("stream error", err)
				} else {
					console.log("stream done")
				}
			})
			event._handled = true;
		} else {
			return stream;
		}
	})
)

router.post(
	"/stream",
	defineEventHandler(async (event) => {
		console.log("POST", event.path)
		const query = getQuery(event);
		const error = Boolean(query.error);
		const stream = query.type === "web" ? getRequestWebStream(event) : event.node.req;
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

createServer(toNodeListener(app)).listen(process.env.PORT || 3000);