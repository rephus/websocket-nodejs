// Draw everything


var render = function () {
	if (!user) return;

	camera.clear();

	drawSectors();

	drawUsers();

	camera.center(user.position[0], user.position[1]);
	drawCircle(user.position[0], user.position[1], 2);

	var orig = screenOrigin(user.position) ;
	drawText(orig[0],orig[1],  "Sector:"+  sector.id);
	drawText(orig[0],orig[1]+25, "Position:"+  user.position);
	drawText(orig[0],orig[1]+50, "Users:"+  sector.users.length);
};

var screenOrigin = function(userPosition) {
	var halfW = canvas.width /2;
	var halfH = canvas.height/2;
	return [userPosition[0] - halfW, userPosition[1] - halfH];
};

var drawUsers = function(){

	for (var s= 0; s < sectors.length; s++){
		var sector = sectors[s];

		for (var i=0; i < sector.users.length; i++){
			var otherUser = sector.users[i];
			if (user.connectionId != otherUser.connectionId) {
				drawCircle(otherUser.position[0], otherUser.position[1], 2);
			}
		}
	}
};

var drawSectors = function(){
	var SECTOR_SIZE = 500;

		ctx.beginPath();

		// Draw surrounding sectors
		ctx.strokeStyle="orange";
	  for (var i= 0; i < sectors.length; i++){
			origin = sectors[i].origin;
			ctx.rect(origin[0],origin[1],SECTOR_SIZE,SECTOR_SIZE);
		}
		ctx.stroke();
};
