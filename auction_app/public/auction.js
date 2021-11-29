var socket;

function Login() {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let data = JSON.parse(this.responseText);
      console.log(data);
      if (data["res"] == "true") {
        localStorage["username"] = data["username"];
        window.location = "http://localhost:3000/player";
      } else {
        console.log(data["res"]);
      }
    }
  };

  let name = document.getElementById("name").value;
  xhttp.open("GET", "/login?name=" + name, true);
  xhttp.send();
}
