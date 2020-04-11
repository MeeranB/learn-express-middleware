function getUser(req, res, next) {
  const token = req.cookies.user;
  if (token) {
    const user = jwt.verify(token, SECRET);
    req.user = user;
  }
  next();
}

module.exports = getUser;
