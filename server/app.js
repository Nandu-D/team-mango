const createError = require("http-errors");
const express = require("express");
const { join } = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const interviewRouter = require("./interview/interview.controller");
const accountRouter = require("./users/users.controller");
const questionRouter = require("./question/question.controller");
const runCode = require("./helpers/runcode");
const videoRouter = require("./video-chat/videoChatApis");

const { json, urlencoded } = express;

var app = express();

app.use(logger("dev"));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));

app.use("/", accountRouter);
app.use("/users", require("./users/users.controller"));
app.use("/interviews", interviewRouter);
app.use("/questions", questionRouter);
app.use("/video", videoRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err });
});

module.exports = app;
