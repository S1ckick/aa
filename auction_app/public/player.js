function writeMsg(msg) {
  let time = new Date().toLocaleTimeString();
  let $tr = $("<tr>").append($("<td>").append(time + " " + msg));
  $("#tableMessage > tbody:last-child").append($tr);
  document.getElementById("textarea").scrollTop =
    document.getElementById("textarea").scrollHeight;
}

function changePrice() {
  let price = document.getElementById("price").value;
  $.get(
    "/price?add=" + price + "&name=" + localStorage["username"],
    function (data, status) {
      console.log(data);
      if (data.money) {
        document.getElementById("cash").innerHTML = data.money;
      }
    }
  );
}

$(document).ready(() => {
  $.get(
    "/getuserdata?name=" + localStorage["username"],
    function (data, status) {
      let item = $.parseJSON(data);
      console.log(item);

      $("#username").append(item.name);
      $("#cash").append(item.cash);
    }
  );
  var socket = io.connect("http://localhost:3030");
  socket.on("connect", () => {
    socket.emit("client_connect", { name: localStorage["username"] });
  });
  socket.on("msg", (msg) => {
    writeMsg(msg.message);
  });
  socket.on("end", (msg) => {
    $("#bet").css("display", "None");
    writeMsg(msg.message);
  });
  socket.on("buy", (msg) => {
    console.log(msg.cash);
    $("#cash").text(msg.cash);
  });
  socket.on("auc", (data) => {
    $("#image").attr(
      "src",
      "public/images/" + data.idx + ".jpg?timestamp=" + new Date().getTime()
    );
    $("#bet").css("display", "block");
    writeMsg(data.time + " " + data.idx + " " + data.start_price);
    document.getElementById("price").value = data.min_step;
    var time = data.time;
    var minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((time % (1000 * 60)) / 1000);
    document.getElementById("demo").innerHTML = minutes + "m " + seconds + "s ";
    var x = setInterval(() => {
      time -= 1000;
      if (time === 0) {
        clearInterval(x);
      }
      minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
      seconds = Math.floor((time % (1000 * 60)) / 1000);
      document.getElementById("demo").innerHTML =
        minutes + "m " + seconds + "s ";
      if (time <= 3000) {
        writeMsg("remain " + seconds + "s ");
      }
    }, 1000);
  });
});

function goto() {
  window.location.href = "http://localhost:3000/player/arts";
}
