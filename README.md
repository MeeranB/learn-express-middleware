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

It would be useful to also have the time of each request in the log. You can get a nicely formatted time using the `toLocaleTimeString` method of date objects. Use this to log the time of each request.

<details>
<summary>Solution</summary>

```js
server.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`${time} ${req.method} ${req.url}`);
  next();
});
```

</details>

## Authentication middleware

### Accessing the user

Currently we are accessing the user cookie in three handlers (`GET /`, `GET /profile` and `GET /profile/settings`). We have to verify and decode a JWT to ensure the token was valid. This ends up being quite a lot of code repeated whenever we want to use the email value from the cookie. Let's create a `getUser` middleware to handle this repeated task.

We don't know which routes will want to access the logged in user value so we'll set this middleware on the whole app using `server.use`. We'll mimic the other middleware we're using and add the `user` value to the `req` object. This lets us pass values down through the request chain to subsequent handlers.

Create a new middleware that reads the user cookie, verifies it with the `jsonwebtoken` library, then sets the resulting user object as a property on the request object before calling `next`. Make sure you only try to verify the token if you actually have a user cookie.

Then change each handler that currently does this manually to instead grab the user from `req.user`.

<details>
<summary>Solution</summary>

```js
server.use((req, res, next) => {
  const token = req.cookies.user;
  if (token) {
    const user = jwt.verify(token, SECRET);
    req.user = user;
  }
  next();
});

server.get("/profile", (req, res) => {
  const user = req.user;
  // ...
});
```

</details>

### Protecting routes

Currently our `GET /profile` route is a bit broken. If the user isn't logged in the welcome message says `undefined`. This route shouldn't really be accessible at all for unauthenticated users.

Change this handler so that it checks whether the user is present on the request object. If not it should send a `401` HTML response with an error message in the `h1` and a link to the `/log-in` page. If the user

<details>
<summary>Solution</summary>

```js
server.get("/profile", (req, res) => {
  const email = req.user;
  if (!email) {
    res.status(401).send(`
      <h1>Please log in to view this page</h1>
      <a href="/log-in">Log in</a>
    `);
  } else {
    res.send(`<h1>Hello ${email}</h1>`);
  }
});
```

</details>

Now you should see the error if you visit `/profile` when you aren't logged in. However the `GET /profile/settings` route has the same problem. We _could_ copy paste the above code, but it would be better to avoid the duplication and create middleware that makes sure users are logged in.

Create a new function named `checkAuth`. It should take `req`, `res` and `next` as arguments and do the same user check as above. If the cookie is not present render the error HTML. If it is present call `next` to move on to the next handler.

Then add this middleware in front of the handler for any route we want to protect. We don't want this middleware running on all routes, since some of them are public.

<details>
<summary>Solution</summary>

```js
function checkAuth(req, res, next) => {
  const email = req.cookies.user;
  if (!email) {
    res.status(401).send(`
      <h1>Please log in to view this page</h1>
      <a href="/log-in">Log in</a>
    `);
  } else {
    next();
  }
});

server.get("/profile", checkAuth, (req, res) => {});

server.get("/profile/settings", checkAuth, (req, res) => {});
```

</details>

## Error-handling

The `next` function is also used for error-handling. If you call it with no arguments Express will move to the next handler in the chain. However if you call it with an error Express will skip straight to the first error-handling middleware.

For example if we encounter an error reading a file:

```js
server.get("/example", (req, res, next) => {
  fs.readFile("example.txt", (error, contents) => {
    if (error) {
      next(error);
    } else {
      // carry on
    }
  });
});
```

Calling `next(error)` stops this handler executing and jumps straight to the first error-handling middleware. If you haven't created any then Express' built-in one will handle the error. By default this will respond with a `500` error. Express will also catch any errors that get thrown by your application.

Creating our own error-handling middleware is a little weird. An error-handler has _four_ arguments instead of the usual two or three—the first is the error itself:

```js
function handleErrors(error, req, res, next) {
  // handle the error
}
```

Express knows this middleware is for errors (because it has four arguments), so it will only get called when there's an error to deal with (i.e when a handler calls `next` with an error, or an error is thrown).

Add an error-handling middleware to your server that logs the error it receives and then responds with a `500` status and a generic error message to the browser. You can test this by visiting the http://localhost:3000/error route to cause a fake error.

<details>
<summary>Solution</summary>

```js
function handleErrors(error, req, res, next) {
  console.error(error);
  res.status(500).send(`<h1>Something went wrong</h1>`);
}

server.use(handleErrors);
```

</details>

The `500` status code is for general server errors, but sometimes we might want to be more specific. Since JavaScript errors are objects we can attach extra properties to them, like a status code.

Amend the `GET /error` handler to add a `status` property to `fakeError` with a value of `403`. Then amend your error handler to use this property as the response status code (defaulting to `500` if there isn't one).

<details>
<summary>Solution</summary>

```js
server.get("/error", (req, res, next) => {
  const fakeError = new Error("uh oh");
  fakeError.status = 403;
  next(fakeError);
});

function handleErrors(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status).send(`<h1>Something went wrong</h1>`);
}

server.use(handleErrors);
```

</details>

## Stretch goal: fancier error-handling

The built-in Express error-handler does a bit more than just sending a static error message. It behaves differently in development and product.

While you're developing locally it sends the entire error's stack trace as a response, allowing you to see exactly what went wrong in the browser. This would be dangerous for real users to have access to, so in production it just sends the default status message for each error code (e.g. `200 Ok`, `404 Not found`, `401 Unauthorized` etc).

Node actually comes with a list of all the HTTP error codes and their messages. You can get them from `http.STATUS_CODES`. For example:

```
const { STATUS_CODES } = require("http");

console.log(STATUS_CODES[401]); // "Unauthorized"
```

You can check whether your app is running in production using `process.env.NODE_ENV`. Production environments like Heroku will set this environment variable to "production".

Amend your error-handler to send a standard HTTP status message in production, and the entire error stack trace in development.

**Hint**: look at the `error.stack` property.

<details>
<summary>Solution</summary>

```js
function handleErrors(error, req, res, next) {
  console.error(error);
  const status = error.status || 500;
  res.status(status);
  if (process.env.NODE_ENV === "production") {
    res.send(STATUS_CODES[status]);
  } else {
    res.send(error.stack);
  }
}

server.use(handleErrors);
```

</details>
