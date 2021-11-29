$(document).ready(() => {
  $.get(
    "/getplayerarts?name=" + localStorage["username"],
    function (data, status) {
      console.log($.parseJSON(data));
      $.each($.parseJSON(data), function (i, item) {
        let img = $("<img width='200px' height='200px'>");
        img.attr(
          "src",
          "../public/images/" +
            item.id +
            ".jpg?timestamp=" +
            new Date().getTime()
        );
        let $tr = $("<tr>").append(
          $("<td>").append(img),
          $("<td>").text(item.cost)
        );
        $("#tableArts > tbody:last-child").append($tr);
      });
    }
  );
});
