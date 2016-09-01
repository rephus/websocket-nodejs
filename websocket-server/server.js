
var ws = require("nodejs-websocket");

var clients = {};

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);

     clients[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
       connection: conn
     };
    console.log("Total connections " + Object.keys(clients).length);

    conn.on("text", function (str) {
        console.log("Received from "+connectionId+ ": "+str);
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        delete clients[connectionId];
        console.log("Total connections " + Object.keys(clients).length);
        //clearInterval(interval);
    });

}).listen(8001);

//Send messages to all connected clients at the same time every 5 seconds
var interval = setInterval(function(){
  var data = "" + new Date().getTime();
  var clientIds = Object.keys(clients);
  console.log("Sending data to "+ clientIds.length + " clients: "+data);

  for (var c in clientIds ){
    var conn = clients[clientIds[c]].connection;
    if (conn)  conn.sendText(data);
  }
},5000);

console.log("Websocket server started");

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json));
};
