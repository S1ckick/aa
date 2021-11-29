// @flow

const express = require("express");
const bodyParser = require("body-parser");
const jsonData = require("./public/settings.json");
const users = jsonData["people"];
const arts = jsonData["drawings"];
const settings = jsonData["options"];

let artIdx = 0;
let curPrice = parseInt(arts[artIdx]["start_price"]);
let curHolder = "";

var Rollbar = require("rollbar");
const { send } = require("process");
var rollbar = new Rollbar({
  accessToken: "91fa99e7e9e74f8299f3233e7ee652bf",
  captureUncaught: true,
  captureUnhandledRejections: true,
});

var server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use("/public", express.static("public"));
server.set("view engine", "pug");
server.set("views", `./views`);

server.get("/", (req, res) => {
  res.render("index", {});
});

server.get("/player", (req, res) => {
  res.render("player", {});
});

server.get("/admin", (req, res) => {
  res.render("admin", { users: users, arts: arts });
});

server.use(rollbar.errorHandler());

server.listen(3000, function () {
  rollbar.debug("Listening on port 3000");
});

const http = require("http").Server(server);
const io = require("socket.io")(http, { cors: { origin: "*" } }).listen(3030);
var sockets = [];

io.sockets.on("connection", function (socket) {
  sockets.push(socket);
  socket.on("hello", (msg) => {
    socket["name"] = msg.name;
    send_back(socket, `Присоединился ${msg.name}`);
  });
  socket.on("client_connect", (msg) => {
    socket["name"] = msg.name;
    send_back(socket, `Присоединился ${msg.name}`);
  });
  socket.on("msg", (msg) => {
    send_back(socket, `${socket["name"]} : ${msg.value}`);
  });
  socket.on("disconnect", (msg) => {
    send_back(socket, `Покинул ${socket["name"]}`);
  });

  socket.emit("hello", 'Сообщение "hello" от socket.io');
});

function send_back(socket, msg) {
  socket.emit("msg", { message: `${msg}` });
  socket.broadcast.emit("msg", { message: `${msg}` });
}

function isUserExist(username) {
  for (let i = 0; i < users.length; i++) {
    if (username === users[i]["name"]) {
      return true;
    }
  }
  return false;
}

function getUserByName(username) {
  for (let i = 0; i < users.length; i++) {
    if (username === users[i]["name"]) {
      rollbar.debug("Found user " + username);
      return users[i];
    }
  }
  rollbar.error("Could not find user");
  return false;
}

function timeToInt(t) {
  return (
    Number(t.split(":")[0]) * 60 * 60 * 1000 +
    Number(t.split(":")[1]) * 60 * 1000 +
    Number(t.split(":")[2]) * 1000
  );
}

function endArt() {
  if (curPrice !== parseInt(arts[artIdx]["start_price"])) {
    getUserByName(curHolder)["draws"].push({ id: artIdx, cost: curPrice });
    getUserByName(curHolder)["cash"] =
      parseInt(getUserByName(curHolder)["cash"]) - curPrice;
    for (let i = 0; i < sockets.length; i++) {
      if (sockets[i]["name"] === curHolder) {
        sockets[i].emit("buy", { cash: getUserByName(curHolder)["cash"] });
      }
      if (sockets[i]["name"] === "admin") {
        sockets[i].emit("sold", {
          id: artIdx,
          cost: curPrice,
          holder: curHolder,
        });
      }
    }
    for (let i = 0; i < sockets.length; i++) {
      sockets[i].emit("msg", {
        message: "Sold to " + curHolder + " for " + curPrice + " !",
      });
    }
  }
  if (artIdx + 1 === arts.length) {
    for (let i = 0; i < sockets.length; i++) {
      sockets[i].emit("end", { message: "Auction ended!" });
    }
  } else {
    artIdx += 1;
    curPrice = parseInt(arts[artIdx]["start_price"]);
    curHolder = "";
    console.log("next!" + artIdx + " " + curPrice);
    let t = settings.interval;
    let ms = timeToInt(t);
    for (let i = 0; i < sockets.length; i++) {
      sockets[i].emit("auc", {
        time: ms,
        idx: artIdx,
        start_price: curPrice,
        min_step: arts[artIdx]["min_step"],
      });
    }
  }
}

function setIntervalX(callback, delay, repetitions) {
  var x = 0;
  var intervalID = setInterval(function () {
    callback();

    if (++x === repetitions) {
      clearInterval(intervalID);
    }
  }, delay);
}

function startAuction() {
  for (let i = 0; i < sockets.length; i++) {
    sockets[i].emit("msg", { message: "Auction started!" });
  }
  let ms = timeToInt(settings.interval);
  let timeout = timeToInt(settings.timeout);
  console.log(ms);
  for (let i = 0; i < sockets.length; i++) {
    sockets[i].emit("auc", {
      time: ms,
      idx: artIdx,
      start_price: curPrice,
      min_step: arts[artIdx]["min_step"],
    });
  }
  var intervalId = setIntervalX(endArt, ms + timeout, arts.length);
}

server.get("/login", (req, res) => {
  console.log(req.query["name"]);
  if (isUserExist(req.query["name"])) {
    res.send(JSON.stringify({ res: "true", username: req.query["name"] }));
  } else {
    res.send(JSON.stringify({ res: "false" }));
  }
});

server.get("/start", (req, res) => {
  startAuction();
  res.send(JSON.stringify({ res: "true" }));
});

server.get("/price", (req, res) => {
  console.log(req.query.add);
  let money = parseInt(req.query.add);
  let user = getUserByName(req.query.name);
  if (money <= parseInt(user["cash"])) {
    curPrice += parseInt(req.query.add);
    curHolder = req.query.name;

    for (let i = 0; i < sockets.length; i++) {
      sockets[i].emit("msg", {
        message: "Current price: " + curPrice + " holder: " + curHolder,
      });
    }

    res.send(JSON.stringify({ money: user["cash"] }));
  } else {
    res.send(JSON.stringify({ error: "Not enough money :(" }));
  }
});

server.get("/getuserdata", (req, res) => {
  console.log(req.query["name"]);
  if (isUserExist(req.query["name"])) {
    res.send(JSON.stringify(getUserByName(req.query["name"])));
  } else {
    res.send(JSON.stringify({ res: "false" }));
  }
});

server.get("/player/arts", (req, res) => {
  res.render("arts", {});
});

function getArts() {
  let result = arts;
  console.log(users);
  for (let userIdx in users) {
    let draws = users[userIdx].draws;
    for (let artIdx in draws) {
      let artId = draws[artIdx].id;

      for (let item in result) {
        if (parseInt(result[item].id) === artId) {
          result[item]["holderName"] = users[userIdx]["name"];
          result[item]["cost"] = draws[artIdx]["cost"];
          break;
        }
      }
    }
  }
  return result;
}

server.get("/getarts", (req, res) => {
  res.send(JSON.stringify(getArts()));
});

function getPlayerArts(name) {
  for (let i = 0; i < users.length; i++) {
    if (users[i]["name"] === name) {
      return users[i]["draws"];
    }
  }
}

server.get("/getplayerarts", (req, res) => {
  res.send(JSON.stringify(getPlayerArts(req.query.name)));
});

server.get("/getusers", (req, res) => {
  res.send(JSON.stringify(users));
});
