
var ws = require("nodejs-websocket");

redis = require('redis').createClient();
global.redis = redis;

var SECTOR_SIZE = 500;

var clients = {};

var sectors = {
  "0,0": { id: "0,0", users:[], origin: [0,0] }
};

var load = function(){
    redis.get('clients', function(err, reply) {
      if (err || !reply) return;
      clients = JSON.parse(reply);
      console.log("Loaded saved game data from redis"+
        ", clients: " + Object.keys(clients).length);

    });
    redis.get('sectors', function(err, reply) {
      if (err || !reply) return;
      sectors = JSON.parse(reply);
      console.log("Loaded saved game data from redis"+
        ", sectors: "+ Object.keys(sectors).length);

    });
};

load();

var save = function(){
  console.log("Saving game data on redis " +
    ", clients: " + Object.keys(clients).length+
    ", sectors: "+ Object.keys(sectors).length);
  redis.set('clients', JSON.stringify(clients, function( key, value) {
    //Save clients with connection circular structure
    //console.log("key " +key);
    if( key == 'connection') { return undefined;}
    if( key == 'status') { return 'disconnected';}
    else {return value;}
  }));
  redis.set('sectors', JSON.stringify(sectors, function( key, value) {
    if( key == 'users') { return [];}
    else {return value;}
  }));
};

setInterval(function(){
  save();
}, 10 * 1000);

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);
    sendJson(conn, {type: 'connection', id: connectionId});

      newUser(conn);

    conn.on("text", function (str) {
        //console.log("Received from "+connectionId+ ": "+str);

        //try {
          var json = JSON.parse(str);
          processJson(conn, json);

        //} catch(e){
        //  console.error("Unable to parse JSON "+ e+ ": "+ str);
        //}
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        var client = clients[connectionId];
        //delete clients[connectionId];
        clients[connectionId].status = 'disconnected';

        var xy = positionToSector(client.user.position);
        var sector = getOrCreateSector(xy);
        deleteUserFromSector(sector, client.user);
        //clearInterval(interval);
    });

}).listen(8001);

var getCloseSectors = function(xy){
  //TODO for negative positions, needs to be xy[z] -2, don't ask why
  //console.log("Get close sectors for " + xy);
  var closePositions = [
    [xy[0]-1, xy[1]-1], [xy[0], xy[1]-1], [xy[0]+1, xy[1]-1],
    [xy[0]-1, xy[1]], [xy[0], xy[1]], [xy[0]+1, xy[1]],
    [xy[0]-1, xy[1]+1] ,[xy[0], xy[1]+1], [xy[0]+1, xy[1]+1]
  ];
  var sectors = [];
  for (var i=0; i < closePositions.length; i++){
    sectors.push(getOrCreateSector(closePositions[i]));
  }

  return sectors;
};
var getOrCreateSector = function(xy) {
  var index = xy[0] +","+ xy[1];
  if (sectors[index]) {
     return sectors[index];
  } else {
     return createSector(index);
  }
};

var createSector = function(index){
  // TODO sector to index method
  var origin = index.split(','); // Reverse index + position
  origin = [origin[0] *  SECTOR_SIZE, origin[1] * SECTOR_SIZE];
  sectors[index] =  { id: index, users:[], origin: origin };
  return sectors[index];
};

//Send messages to all connected clients at the same time every 5 seconds
var interval = setInterval(function(){
  var clientIds = Object.keys(clients);
  //console.log("Sending data to "+ clientIds.length + " clients: "+clientIds);
  //console.log("Sectors (" + Object.keys(sectors).length  +"): "+ Object.keys(sectors));
  for (var i = 0; i < clientIds.length; i++){
    var connectionId = clientIds[i];
    var client = clients[connectionId];
    if (client && client.connection &&
      client.status && client.status == "connected") {

      var conn = client.connection;
      // TODO position to sector method
      var xy = positionToSector(client.user.position);
      //console.log(" Sending  data to user " +connectionId + " on sector " +xy);
      var sector = getOrCreateSector(xy);
      var sectors = getCloseSectors(xy);
      sendJson(conn, {type: 'update', user: client.user, sector: sector, sectors: sectors});
    }
  }
},100);

var positionToSector = function(xy) {
  return [parseInt(xy[0] / SECTOR_SIZE) , parseInt(xy[1]/ SECTOR_SIZE)];
};

console.log("Websocket server started");
var newUser = function(connection){
  var connectionId = connection.key;

  var user = {
    position: [150,150],
    connectionId: connectionId,
  };
  clients[connectionId] = {
    id: connectionId,
    created: new Date().getTime(),
    connection: connection,
    user: user,
    status: 'connected',
    sector: [0,0]
  };
};

var deleteUserFromSector = function(sector, user){
  try {
    for(var i = 0 ; i < sector.users.length; i++){
        if(sector.users[i].connectionId == user.connectionId){
            sector.users.splice(i,1);
        }
    }
  } catch (e) {
    console.error("Unable to remove user "+ user.connectionId+ " from sector " + sector.id + " with users " + sector.users);
  }
};

var startUser = function(connection){
  client = clients[connection.key];
  var xy = positionToSector(client.user.position);
  var sector = getOrCreateSector(xy);
  var sectors = getCloseSectors(xy);
  sendJson(connection, {type: 'start', user: client.user, sector: sector, sectors: sectors});
};

var processJson = function(connection, json) {
  var type = json.type;
  var connectionId = connection.key;
  switch(type){
    case 'new':
      startUser(connection);
      break;
    case 'renew':
      // Copy the existing old connectionId form the user to the new connectionId
      // to be able to reuse connections (persisting user sessions)
      if (clients[json.connectionId]){
        //newUser(connection);
        clients[connectionId] = clients[json.connectionId]; //IF this causes problems, try to stringify/parse
        console.log("Restore user on connection "+json.connectionId+" " + JSON.stringify(clients[connectionId].user));
        clients[connectionId].status = "connected";
        clients[connectionId].connection = connection;

        //delete clients[json.connectionId];
      } else {
          newUser(connection);
          console.log("Connection id "+json.connectionId+" doesn't exist in " +
            Object.keys(clients) +", creating new user");
      }
      startUser(connection);
      break;
   case 'update':

     var position = json.user.position;
      clients[connectionId].user.position = position;

      //Update user sector
      var oldSector = clients[connectionId].sector;
      var newSector = positionToSector(position);
      //if (oldSector[0] != newSector[0] && oldSector[1] != newSector[1]){
      //  console.log("User "+ connectionId + " has changed sector from "+ oldSector + " to " + newSector);
        var old = sectors[oldSector[0]+","+oldSector[1]];
        deleteUserFromSector(old, json.user);
        var news =  getOrCreateSector(newSector);
        news.users.push(json.user);
        clients[connectionId].sector = newSector;
      //}
      break;
    default:
        console.error("Json type not recognized: "+type);
  }
};

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json));
};
