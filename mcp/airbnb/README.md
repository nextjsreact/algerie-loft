# Airbnb MCP Server

This MCP server provides an interface to the Airbnb API.

## Running the Server

To run the server, you will need to have Deno installed. You can install it from https://deno.land/#installation.

You will also need to create a `.env` file in this directory with the following variables:

```
AIRBNB_CLIENT_ID=your_airbnb_client_id
AIRBNB_CLIENT_SECRET=your_airbnb_client_secret
AIRBNB_REDIRECT_URI=http://localhost:3000/api/auth/airbnb
```

Once you have Deno installed and the `.env` file created, you can run the server with the following command:

```
deno run --allow-net --allow-env index.ts
