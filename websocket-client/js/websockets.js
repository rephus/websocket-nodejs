var ws, connectionId;
var user, sector, sectors = [];

setInterval(function(){
  if (ws && user ) sendJson({
    type: 'update', user: user
  });
},100);

function connect() {
   if ("WebSocket" in window) {
      log("Opening websocket!");
      ws = new WebSocket("ws://192.168.2.100:8001/");

      ws.onopen = function(){
         //ws.send("ping");
         log("Connection opened !!");
      };

      ws.onmessage = function (evt){
        console.log("Message received: ", evt.data);
        try {
           var json = JSON.parse(evt.data);
           switch(json.type) {
             case "connection":
                var savedConnectionId = localStorage.getItem("connectionId");
                if (savedConnectionId) {
                  log("Found existing connection Id "+savedConnectionId);
                  sendJson({type: 'renew', connectionId: savedConnectionId });
                } else {
                  log("New game");

                  sendJson({type: 'new'});
                }
                break;
            case 'start':
                log("Saving connection ID "+ json.user.connectionId);
                localStorage.setItem("connectionId", json.user.connectionId);
                user = json.user;
                sector = json.sector;
                break;
             case 'update':
                 //user = json.user;
                 sector = json.sector;
                 sectors = json.sectors;
                 //if (!gameStatus) main();
                 break;
             default: log("Message not recognized " + evt.data);
           }
         } catch (e){
           log("Unable to parse evt: "+e + ", "+evt.data);
         }
      };

      ws.onclose = function() {
         log("Connection is closed.");
         setTimeout(connect, 5000);
      };
   } else log("WebSocket NOT supported by your Browser!");
}

function sendJson(json){
  json.connection = connectionId;
  //console.log("Sending",json);
  ws.send(JSON.stringify(json));
}

connect();
