# Learn Express Middleware

Learn how to write your own Express middleware to do logging, authentication and error-handling.

## Middleware

Express is built around middleware. Middleware are functions that receive a request, do something with it, then either pass the request on to the next middleware or send a response (ending the chain).

Technically all route handlers are middleware, but conceptually middleware usually transform the request in some way and don't actually send a response.

For example the built in `express.urlencoded` middleware parses form-encoded request bodies and attaches them to the request object for subsequent handlers to use. The 3rd party `cookie-parser` middleware does the same for cookies. We're going to learn how to create our own middleware functions.

## Setup

1. Clone this repo
1. Run `npm install` to install all the dependencies
1. Run `npm run dev` to start the development server

Visit http://localhost:3000 to see the workshop app. You can "log in" by entering an email, which will be saved as a cookie so the server can identify you.

## Our first middleware

It would be useful if our server logged each incoming request to our terminal. That way we can see a log of what's happening as we use our server locally.

We can run a handler for every route by using `server.use`:

```js
server.use((req, res) => {
  console.log(`${req.method} ${req.url}`);
});
```

This will log something like `GET /` or `POST /submit` for every request. Unfortunately that's _all_ it will do, as this handler runs and never defers to the next thing in the chain. Your requests should currently be timing out.

Express passes a third argument to all handlers: `next`. This is a function you call inside a handler when you want Express to move on to the next one.

```js
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

This tells Express to run the logger handler before every request, then move on to whatever handler is queued for that route.
