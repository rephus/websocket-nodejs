var MOVE_SPEED = 1;
var update = function (modifier) {
	if (!user) return;

	var xy = controls(modifier);

	if (user && user.position){
		var x = user.position[0];
		var y = user.position[1];
		user.position[0]  = x + MOVE_SPEED * xy[0];
		user.position[1] = y + MOVE_SPEED * xy[1];
	}
};
