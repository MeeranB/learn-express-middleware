const { STATUS_CODES } = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3000;

const server = express();

server.use(cookieParser());
server.use(express.urlencoded());

server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

function checkAuth(req, res, next) {
  const email = req.cookies.user;
  if (!email) {
    const error = new Error("Unauthorized");
    error.status = 403;
    next(error);
    // res.status(401).send(`
    //   <h1>Please log in to view this page</h1>
    //   <a href="/log-in">Log in</a>
    // `);
  } else {
    res.locals.user = email;
    next();
  }
}

server.get("/", (req, res) => {
  const email = req.cookies.user;
  console.log(email);
  res.send(`
    <h1>Hello world</h1>
    ${email ? `<a href="/log-out">Log out</a>` : `<a href="/log-in">Log in</a>`}
  `);
});

server.get("/log-in", (req, res) => {
  res.send(`
    <h1>Log in</h1>
    <form action="/log-in" method="POST">
      <label for="email">Email</email>
      <input type="email" id="email" name="email">
    </form>
  `);
});

server.post("/log-in", (req, res) => {
  const email = req.body.email;
  res.cookie("user", email, { maxAge: 600000 });
  res.redirect("/profile");
});

server.get("/log-out", (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

server.get("/profile", checkAuth, (req, res) => {
  const email = res.locals.user;
  res.send(`<h1>Hello ${email}</h1>`);
});

server.use((req, res) => {
  res.status(404).send(`<h1>Page not found</h1>`);
});

server.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status);
  switch (status) {
    case 401:
      return res.send(`
        <h1>Please log in to view this page</h1>
        <a href="/log-in">Log in</a>
      `);
    default:
      const message =
        process.env.NODE_ENV === "production"
          ? STATUS_CODES[status]
          : `<pre>${error.stack}</pre>`;
      return res.send(message);
  }
});

server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
