var ws, connectionId;

function connect() {
   if ("WebSocket" in window) {
      append("Opening websocket!");
      ws = new WebSocket("ws://localhost:8001/");

      ws.onopen = function(){
         //ws.send("ping");
         append("Connection opened !!");
      };

      ws.onmessage = function (evt){
        append("Message received: " + evt.data);

         /*var json = JSON.parse(evt.data);
         switch(json.type) {
           case "connection":
              connectionId = json.value;
              append("Connected to server with id " + connectionId);
              break;
           case 'user': drawUser(json); break;
           default: append("Message not recognized " + evt.data);
         }*/
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

$("#send").click(function(){
  var input = $("#input").val();
  if (input) {
    append("Sending message: "+input);
    ws.send(input);
  }
});

connect();
