var ws, connectionId;

function connect() {
   if ("WebSocket" in window) {
      append("Opening websocket!");
      ws = new WebSocket("ws://37.187.97.187:8001/echo");

      ws.onopen = function(){
         //ws.send("ping");
         //append("Sending ping...");
      };

      ws.onmessage = function (evt){
         var json = JSON.parse(evt.data);
         switch(json.type) {
           case "connection":
              connectionId = json.value;
              append("Connected to server with id " + connectionId);
              break;
           case 'user': drawUser(json); break;
           default: append("Message not recognized " + evt.data);
         }
      };

      ws.onclose = function() {
         append("Connection is closed.");
      };
   } else append("WebSocket NOT supported by your Browser!");

}

function append(text){
  console.log(text);
  $("#log").append(text+"\n");
}
function sendJson(json){
  json.connection = connectionId;
  //console.log("Sending",json);
  ws.send(JSON.stringify(json));
}

function drawUser(user) {
  var userId = user.id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "");
  console.log("Drawing user " + userId);
  var $user = $('#'+userId);
  if (!$user.length) {
    $user = $("<div class='user' id='"+userId+"'></div>");
    $("body").append($user);
  }
  $user.css({top: user.y, left: user.x});
}
$(document).mousemove(function( event ) {
  var move = {type: 'move', x: event.pageX, y: event.pageY};
  sendJson(move);
});

connect();
