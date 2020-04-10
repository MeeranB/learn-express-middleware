const express = require("express");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 3000;

const server = express();

server.use(cookieParser());
server.use(express.urlencoded());

server.get("/", (req, res) => {
  const email = req.cookies.user;
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

server.get("/profile", (req, res) => {
  const email = req.cookies.user;
  res.send(`<h1>Hello ${email}</h1>`);
});

server.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
