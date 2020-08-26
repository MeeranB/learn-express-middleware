const { STATUS_CODES } = require("http");

function handleErrors(error, req, res, next) {
    console.error(error);
    const status = error.status || 500;
    res.status(status);
    if (process.env.NODE_ENV === "production") {
      res.send(STATUS_CODES[status]);
    } else {
      res.send(`${error.stack}`);
    }
  }

module.exports = handleErrors;