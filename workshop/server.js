const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
const SECRET = "nkA$SD89&&282hd";

const server = express();

server.use(cookieParser());
server.use(express.urlencoded());

server.get("/", (req, res) => {
  const token = req.cookies.user;
  if (token) {
    const user = jwt.verify(token, SECRET);
    res.send(`<h1>Hello ${user.email}</h1><a href="/log-out">Log out</a>`);
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

server.get("/log-out", (req, res) => {
  res.clearCookie("user");
  res.redirect("/");
});

server.get("/profile", (req, res) => {
  const token = req.cookies.user;
  const user = jwt.verify(token, SECRET);
  res.send(`<h1>Hello ${user.email}</h1>`);
});

server.get("/profile/settings", (req, res) => {
  const token = req.cookies.user;
  const user = jwt.verify(token, SECRET);
  res.send(`<h1>Settings for ${user.email}</h1>`);
});

server.get("/error", (req, res, next) => {
  const fakeError = new Error("uh oh");
  next(fakeError);
});

server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
