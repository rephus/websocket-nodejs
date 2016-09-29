// Handle keyboard controls
var keysDown = {};

var KEY_UP =38, KEY_DOWN =40, KEY_LEFT =37, KEY_RIGHT =39;

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);


addEventListener("click", function(e) {
	var x = e.pageX - canvas.offsetLeft ;
	var y = e.pageY - canvas.offsetTop;

	var world = worldPosition(x,y);
	console.log("click ",x,y, " to world ",world);
	user.position = [world.x, world.y];
}, false);

var worldPosition = function(x,y) {
	var originWorld = camera.origin();
	return {x: parseInt(originWorld.x + x),
		y: parseInt(originWorld.y + y)
	};
};

addEventListener('contextmenu', function(e){ //Right click

	childUtils.add(player.x,player.y);

	e.preventDefault();
  return(false);
}, false);

//Called from update.js
var controls = function(modifier){
	var x = 0;
	var y = 0;
  if (KEY_LEFT in keysDown) x = -1;
  if (KEY_RIGHT in keysDown )  x= +1;
	if (KEY_UP in keysDown ) y = -1;
	if (KEY_DOWN in keysDown )  y = +1;
	return [x,y];
};
