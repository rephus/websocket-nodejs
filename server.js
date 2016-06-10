
var ws = require("nodejs-websocket");

var connections = {};

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);

     connections[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
     };
    console.log("Total connections " + Object.keys(connections).length);
    sendJson(conn, {type: "connection", value:connectionId});

    var interval = setInterval(function(){
      for (var c in connections){
        var connection = connections[c];

        //Return position of all players except himself
        if (connection.id != connectionId) sendJson(conn, {type: "user", id: connection.id, x: connection.x, y: connection.y});
      }
    },100);

    conn.on("text", function (str) {
        //console.log("Received "+str);
        var json = JSON.parse(str);
        switch(json.type) {
          case "move":
            try{
              var user = connections[json.connection];

              user.x = json.x;
              user.y = json.y;
            } catch(e) {
              console.error("Unable to set position of user ", user, json);
            }
          break;
          default: console.error("Unrecognized command "+str);
        }
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        delete connections[connectionId];
        console.log("Total connections " + Object.keys(connections).length);
        clearInterval(interval);
    });

}).listen(8001);

console.log("Websocket server started");

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json));
};
