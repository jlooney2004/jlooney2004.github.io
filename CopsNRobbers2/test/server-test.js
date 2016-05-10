var http = require("http").Server();
var io = require("socket.io")(http);

var sID = -1;		// Short integer id counter
var users = {};		// All user data

io.on("connection", function(socket){
	// New player
	sID ++;
	var userID = sID;
	users[userID] = {id: userID, x:0, y:1, z:0};
	console.log("Connected to " + userID);
	socket.broadcast.emit("pNw", userID);
	socket.emit("pCn", userID, users);

	// Disconnected player
	socket.on("disconnect", function(){
		console.log("Disconnected " + userID);
		socket.broadcast.emit("pDs", userID);
		delete users[userID];
	});

	// Player Moved
	socket.on("pMv", function(posObject){
		users[userID].x = posObject.x;
		users[userID].y = posObject.y;
		users[userID].z = posObject.z;
	});
});

function statusBroadcast(){
	io.emit("pUp", users);
}

setInterval(statusBroadcast, 200);

http.listen(8080, function(){
	console.log("listening on *:8080");
});