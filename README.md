# Stream handling issues on h3

This repository demonstrates issues with h3 v2.0.1-rc.16 handling of streams on Node.js v24.

To reproduce errors, install dependencies with `pnpm install`, followed by running the server with `node server.mjs`.

With the server running, invoke the client with the following commands to show broken behaviour.

## `node client.mjs get node client-error`

Failure of h3 to close the response stream after client aborts the request, leaking resources.

Expected server output:
```
node stream constructed
[...]
node stream destroyed at <number> <error>
```

Actual output: node stream is never destroyed


## `node client.mjs get web client-error`

Shows correct handling of aborted requests.

Expected server output:
```
web stream started
[...]
web stream cancelled at <number> <error>
```

## `node client.mjs get node server-error`

Failure of h3 to handle streams that emit an error event, causing the server to crash.

Expected server output:
```
node stream constructed
node stream destroy at <number> <error>
```

Actual output: expected server output plus an unhandled error event crashing the server.

## `node client.mjs get web server-error`

Possible failure of h3 to log that something went wrong.

Expected server output:

```
web stream started
[...]
<a message including the text "read error">
```

Actual server output: no errors logged.

## `node client.mjs get node`

Shows correct handling of backpressure by h3 on a node response stream.

## `node client.mjs get web`

Shows correct handling of backpressure by h3 on a web response stream.

Expected client and server output: production and consumption of data stay roughly in sync.
```
server.mjs          |  client.mjs
produced 0 kb       |  consumed 2000 kb
produced 800 kb     |  consumed 4000 kb
produced 1600 kb    |
produced 2400 kb    |
produced 3200 kb    |
produced 4000 kb    |
```

## `node client.mjs post web`

Shows correct handling of backpressure by h3 on a web request stream.

Expected client and server output: production and consumption of data stay roughly in sync.
```
client.mjs          |  server.mjs
produced 0 kb       |  consumed 2000 kb
produced 800 kb     |  consumed 4000 kb
produced 1600 kb    |
produced 2400 kb    |
produced 3200 kb    |
produced 4000 kb    |
```

## `node client.mjs post web client-error`

Show correct handling by h3 of a stream aborted by the client.

## `node client.mjs post web server-error`

Show correct handling by h3 of a stream error produced by the server.

Expected server output:
```
consumer constructed
[...]
consumer destroyed at <number> <error>
stream error <error>
```

## Additional commands

### `node client.mjs post node ...`

Using `node` instead of `web` to the `post` command makes the server use a `node:stream` pipeline directly with the `event.runtime.node.node.req` stream instead of letting h3 handle it. These cases are all correctly handled.
