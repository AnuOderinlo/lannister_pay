const express = require("express");

const path = require("path");
const morgan = require("morgan");
const responseTime = require("response-time");

const app = express();
const feeRouter = require("./routes/feeRoute");

app.use(responseTime());
app.use(express.json());

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});
app.use("/", feeRouter);

module.exports = app;
