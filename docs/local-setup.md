# Local Setup

To launch a webpack development server with hot reloading, run:

```bash

# install dependencies
npm install

# start the app
npm start
```

This will run `react-scripts start` in addition to running the `proxy.js` file in the root of the project with node.

This file defines an `express` webserver with `http-proxy-middleware` that accepts incoming requests on the default HTTPS port (443) and forwards them to `http://192.168.1.50` (assumed Supabase cluster) at the following ports:

| Path | Forwarded to |
| --- | --- |
| `'/auth', '/rest', '/realtime', '/storage', '/functions', '/analytics', '/pg'`| 8000 |
| `'/project', '/monaco-editor', '/css', '/_next', '/api', '/favicon', '/img'` | 3000 |


