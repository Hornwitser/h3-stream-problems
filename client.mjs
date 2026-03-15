import http from "node:http";
import { nodeSlowConsumer, nodeStream } from "./streams.mjs";
import { pipeline } from "node:stream";

const hasOpt = opt => process.argv.indexOf(opt) !== -1;
const query = new URLSearchParams();
if (hasOpt("web")) query.append("type", "web")
if (hasOpt("fast")) query.append("fast", "1")
if (hasOpt("server-error")) query.append("error", "1")
const post = hasOpt("post");
const clientError = hasOpt("client-error");

const req = http.request(
	`http://localhost:3000/stream?${query}`,
	{ method: post ? "POST" : "GET"},
	(res) => {
		console.log("response", res.statusCode, res.statusMessage);
		if (!post) {
			pipeline(res, nodeSlowConsumer(clientError), (err) => {
				if (err)
					console.log("response read error", err)
				else
					console.log("response read")
			});
		} else {
			res.on("data", (chunk) => console.log(chunk.toString()))
		}
		res.on("close", () => req.destroy());
	}
);
req.on("error", (err) => {
	console.log("request error", err);
});
if (post) {
	pipeline(nodeStream(clientError), req, (err) => {
		if (err) {
			console.log("request sending error", err)
		} else {
			console.log("request sent");
		}
	});
} else {
	req.end();
}

process.on("SIGINT", () => {
	console.log("aborting");
	req.destroy(new Error("Aborted"));
})