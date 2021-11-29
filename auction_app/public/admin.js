// @flow

function writeMsg(msg) {
  let time = new Date().toLocaleTimeString();
  let $tr = $("<tr>").append($("<td>").append(time + " " + msg));
  $("#tableMessage > tbody:last-child").append($tr);
  document.getElementById("textarea").scrollTop =
    document.getElementById("textarea").scrollHeight;
}

$(document).ready(() => {
  $.get("/getarts", function (data, status) {
    console.log(data);
    $.each($.parseJSON(data), function (i, item) {
      let $tr = $("<tr>").append(
        $("<td>").append(item.name),
        $("<td>").text(item.start_price),
        $("<td>").text(item.holderName),
        $("<td>").text(item.cost)
      );
      $("#tableArts > tbody:last-child").append($tr);
    });
  });

  var socket = io.connect("http://localhost:3030");
  socket.on("connect", () => {
    socket.emit("client_connect", { name: "admin" });
  });
  socket.on("msg", (msg) => {
    writeMsg(msg.message);
  });
  socket.on("end", (msg) => {
    writeMsg(msg.message);
  });
  socket.on("auc", (data) => {
    var time = data.time;
    var x = setInterval(() => {
      time -= 1000;
      if (time === 0) {
        clearInterval(x);
      }
      seconds = Math.floor((time % (1000 * 60)) / 1000);
      if (time <= 3000) {
        writeMsg("remain " + seconds + "s ");
      }
    }, 1000);

    writeMsg(data.time + " " + data.idx + " " + data.start_price);
  });
  socket.on("sold", (msg) => {
    $("#tableArts > tbody > tr").eq(msg.id).find("td").eq(3).html(msg.cost);
    $("#tableArts > tbody > tr").eq(msg.id).find("td").eq(2).html(msg.holder);
    console.log("cost" + msg.cost);
  });
});

function start_auction() {
  $.get("/start", function (data, status) {
    console.log(data);
  });
}
