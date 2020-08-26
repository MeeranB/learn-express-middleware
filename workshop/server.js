const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const handleErrors = require("./middleware/handleErrors")
const checkAuth = require("./middleware/checkAuth")
const logger = require("./middleware/logger")
const { STATUS_CODES } = require("http");

const PORT = process.env.PORT || 3000;
const SECRET = "nkA$SD89&&282hd";

const server = express();

server.use(logger)
server.use(cookieParser());
server.use(express.urlencoded());

server.use((req, res, next) => {
  const token = req.cookies.user;
  if (!token) next()
  else {
    const user = jwt.verify(token, SECRET);
    req.user = user;
    next();
  }
})

server.get("/", (req, res) => {
  if (req.user) {
    res.send(`<h1>Hello ${req.user.email}</h1><a href="/log-out">Log out</a>`);
  } else {
    res.send(`<h1>Hello world</h1><a href="/log-in">Log in</a>`);
  }
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
  const token = jwt.sign({ email }, SECRET);
  res.cookie("user", token, { maxAge: 600000 });
  res.redirect("/profile");
});

server.get("/log-out", checkAuth, (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

server.get("/profile", checkAuth, (req, res) => {
    res.send(`<h1>Hello ${req.user.email}</h1>`);
});

server.get("/profile/settings", checkAuth, (req, res) => {
  res.send(`<h1>Settings for ${req.user.email}</h1>`);
});

server.get("/error", (req, res, next) => {
  const fakeError = new Error("uh oh");
  fakeError.status = 403;
  next(fakeError);
});

server.use(handleErrors);

server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
