
function checkAuth(req, res, next) {
    if (!req.user) {
      res.status(401).send(`<h1>Please <a href="/log-in">log in</a></h1>`)
    } else {
      next()
    }
  }

  module.exports = checkAuth;