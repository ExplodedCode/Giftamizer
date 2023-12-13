# Local Setup

To launch a webpack development server with hot reloading, run:

```bash

# install dependencies
npm install

# start the app
npm start
```

This will run `react-scripts start` in addition to running the `proxy.js` file in the root of the project with node.

This file defines an `express` webserver with `http-proxy-middleware` that accepts incoming http requests on port 8000 and forwards them to `http://192.168.1.50` (assumed Supabase cluster) or `localhost` based on the following table:

| Path | Forwarded to |
| --- | --- |
| `'/auth', '/rest', '/realtime', '/storage', '/functions', '/analytics', '/pg'`| http://192.168.1.50:8000 |
| `'/project', '/monaco-editor', '/css', '/_next', '/api', '/favicon', '/img'` | http://192.168.1.50:3000 |
| anything else | http://localhost:443 |

You can access the site at [http://localhost:8000/](http://localhost:8000/).
