# Local Setup

## Setup Supabase Stack

Clone the [ExplodedCode/Giftamizer-Supabase](https://github.com/ExplodedCode/Giftamizer-Supabase.git) repo.

Create a copy of the `.env.example` to `.env` and update the following:

-   `REACT_APP_URL` = `http://local.machine.ip.address:3001/` if you are running the frontend on the same machine.
-   Generate API Keys: https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
    -   ANON_KEY
    -   SERVICE_ROLE_KEY

Change any other variables if needed then start the stack:

```bash
docker compose up -d
```

## Start Frontend

To launch a webpack development server with hot reloading:

```bash
# install dependencies
npm install
```

Create a copy of the `.env.example` to `.env` and update the following:

-   `REACT_APP_SUPABASE_ANON_KEY` = Your Supabase `ANON_KEY` from above

```bash
npm start
```

You can access Giftamizer at [http://localhost:8000](http://localhost:8000).

-   kong will route app traffic like so: http://localhost:8000 > http://localhost:3001.

You can access the Supabase dashboard at [http://localhost:8000/project/default](http://localhost:8000/project/default).
