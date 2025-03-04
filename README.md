# Stream handling issues on h3

This repository demonstrates issues with h3 v1.15.1 handling of streams on Node.js v22.

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

Failure of h3 to close the response stream after client aborts the request, leaking resources.

Expected server output:
```
web stream started
[...]
web stream cancelled at <number> <error>
```

Actual output: web stream is never cancelled

## `node client.mjs get node server-error`
## `node client.mjs get web server-error`

Failure of h3 to close the request after encountering an error in the response stream, leaking resources and hanging the request indefinitely.

Expected client output:

```
consumer constructed
[...]
consumer destroyed at <number> <error>
response read error <error>
```

Actual client output: response hangs indefinitely

## `node client.mjs get node`

Shows correct handling of backpressure by h3 on a node stream.

## `node client.mjs get web`

Failure of h3 to propagate backpressure when serving `ReadableStream`

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

Actual client and server output: Server buffers the whole 80 MB before the client receives anything.

## `node client.mjs post web`

Failure of h3 to propagate backpressure of a request stream.

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

Actual client and server output: Server buffers the whole 80 MB from the client while slowly consuming it.

## `node client.mjs post web client-error`

Show correct handling by h3 of a stream aborted by the client.

## `node client.mjs post web server-error`

Failure of h3 to handle request stream being close by another party.

Expected server output:
```
consumer constructed
[...]
consumer destroyed at <number> <error>
stream error <error>
```

Actual server output: expected output plus an uncaught exception killing the server.

## Additional commands

### `node client.mjs get ... raw`

Adding `raw` to the `get` command makes the server use a `node:stream` pipeline instead of returning the stream and letting h3 handle it. These cases are all correctly handled.

### `node client.mjs post node ...`

Using `node` instead of `web` to the `post` command makes the server use a `node:stream` pipeline directly with the `event.node.req` stream instead of letting h3 handle it. These cases are all correctly handled.
