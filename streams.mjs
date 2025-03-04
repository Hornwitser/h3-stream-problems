import { Readable, Writable } from "node:stream"

const maxCount = 10e6;
const numbersPerChunk = 100;
const errorCount = 1e6;
const bytesPerSecond = 2e6;

function numbers(start) {
	const chunks = [];
	for (let i = start; i < numbersPerChunk + start; i++) {
		chunks.push(String(i).padStart(7) + "\n")
	}
	return chunks.join("");
}

export function nodeStream(error) {
	let i = 0;
	return new Readable({
		construct(cb) {
			console.log("node stream constructed");
			cb();
		},
		read() {
			if (i % 100e3 == 0)
				console.log("produced", i * 8 / 1000, "kb");
			if (error && i >= errorCount) {
				throw new Error("read error");
			}
			if (i < maxCount) {
				this.push(Buffer.from(numbers(i), "utf8"));
				i += numbersPerChunk;
			}
			else
				this.push(null);
		},
		destroy(err, cb) {
			console.log("node stream destroyed at", i, err);
			cb(err);
		},
	})
}

export function webStream(error) {
	let i = 0;
	let encoder = new TextEncoder();
	return new ReadableStream({
		start() {
			console.log("web stream started");
		},
		pull(controller) {
			if (i % 100e3 == 0)
				console.log("produced", i * 8 / 1000, "kb");
			if (error && i >= errorCount) {
				controller.error(new Error("read error"));
				return;
			}
			if (i < maxCount) {
				controller.enqueue(encoder.encode(numbers(i)));
				i += numbersPerChunk;
			} else {
				controller.close();
			}
		},
		cancel() {
			console.log("web stream cancelled at", i);
		}
	})
}

const reportInterval = bytesPerSecond;
const minWaitMs = 100;
export function nodeSlowConsumer(error) {
	let read = 0;
	let timeout = 0;

	return new Writable({
		construct(cb) {
			console.log("consumer constructed");
			cb();
		},
		writev(chunks, cb) {
			for (const { chunk } of chunks) {
				read += chunk.length;
				if ((read - chunk.length) % reportInterval > read % reportInterval)
					console.log("consumed", read / 1000, "kb");
				timeout += chunk.length / bytesPerSecond * 1000;
			}
			if (error && read >= errorCount) {
				cb(new Error("consume failed"));
				return;
			}
			if (timeout > minWaitMs) {
				if (timeout > minWaitMs * 10) {
					console.log("no backoff, consumed", timeout / 1000, "seconds worth of content in an instant")
					timeout = minWaitMs * 10;
				} 
				setTimeout(cb, timeout);
				timeout = 0;
			} else {
				cb();
			}
		},
		destroy(err, cb) {
			console.log("consumer destroyed at", read, err);
			cb(err);
		},
		final(cb) {
			console.log("consumer done at", read);
			cb();
		},
	})
}