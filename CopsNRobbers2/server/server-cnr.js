var http = require("http").Server();
var io = require("socket.io")(http);

var Player = require("./modules/player");
// var Vec2 = require("./modules/vec2");

var sID			= -1;	// Short id counter
var users		= {};	// All user data
var gadget = {id: -1, x: 0, y: 1.5, z: -19};
var game = {points1: 0, points2: 0, teamCop: 0, paused: false};

io.on("connection", function(socket){
	// New player
	sID ++;
	var userID = sID;
	users[userID] = new Player(userID, countTypes());
	console.log("Connected to " + users[userID].id);
	socket.emit("pCn", users[userID], users, gadget);

	// Disconnected player
	socket.on("disconnect", function(){
		console.log("Disconnected " + userID);
		// If holding, drop gadget
		if(userID === gadget.id){
			changeGadgetHolder(-1);
		}
		delete users[userID];
	});

	// Player Moved
	socket.on("pMv", function(posData){
		parseMovedData(userID, posData);
	});
});

// Broadcasts game status 
function statusBroadcast(){
	io.emit("pUp", users);
}

function parseMovedData(userID, posData){
	if(game.paused === true){return false;}
	// Move positions
	users[userID].x = posData.x;
	users[userID].y = posData.y;
	users[userID].z = posData.z;
	users[userID].a = posData.a;

	// UFO Beam
	if(posData.v !== -1 && users[userID].t === 0 && users[userID].v === -1){
		// Fired on target
		if(posData.v >= 0){
			// Corroborate with proximity algorithm
			users[userID].v = posData.v;
			setTimeout(cooldown, 2000, userID);

			// Ensure user exists
			if(users[posData.v]){
				users[posData.v].v = posData.v;
				setTimeout(cooldown, 1000, posData.v);
				checkCopsWin(posData.v);
				// If victim is carrying
				if(gadget.id === posData.v){
					changeGadgetHolder(-1);
				}
			}
		}else if(posData.v === -2){
			users[userID].v = -2;
			setTimeout(cooldown, 2000, userID);
		}
	}

	// Pickup
	if(gadget.id === -1 && posData.h === userID && users[userID].v !== userID){
		// Corroborate with proximity algorithm
		changeGadgetHolder(posData.h);
	}

	// Drop
	if(gadget.id === userID && posData.h === -1){
		changeGadgetHolder(posData.h);
	}

	// Gadget pos update
	if(userID === posData.h && userID === gadget.id){
		gadget.x = posData.x;
		gadget.y = posData.y;
		gadget.z = posData.z;
		if(gadget.x > -1 && gadget.x < 1 && gadget.z > 18 && gadget.z < 20){
			RobbersWin();
		}
	}
}

function RobbersWin(){
	console.log("Robbers win!");
	game.paused = true;
	setTimeout(function(){game.paused = false}, 3000);
	for(user in users){
		users[user].respawn();
	}
	gadget = {id: -1, x: 0, y: 1.5, z: -19};
}

function checkCopsWin(latest){
	var botsTotal = 0;
	var botsCaught = 0;
	for(user in users){
		if(users[user].id !== latest && users[user].t === 1){
			botsTotal ++;
			if(	users[user].y > 1 && 
				users[user].x > -4.5 && 
				users[user].x < 4.5 && 
				users[user].z > -4.5 && 
				users[user].z < 4.5){
				botsCaught ++;
			}
		}
	}

	if(botsTotal === botsCaught){
		console.log("Cops win!");
		game.paused = true;
		setTimeout(function(){game.paused = false}, 3000);
		for(user in users){
			users[user].respawn();
		}
		gadget = {id: -1, x: 0, y: 1.5, z: -19};
	}
}

function cooldown(userID){
	if(typeof users[userID] === "undefined") return false;
	users[userID].v = -1;
}

// Drops gadget
function changeGadgetHolder(holderID){
	gadget.id = holderID;

	for(user in users){
		users[user].h = holderID;
	}
}

// Counts what type is needed
function countTypes(){
	var iUfo = 0;
	var iBot = 0;
	for(user in users){
		if(users[user].t === 0){
			iUfo ++;
		}else if(users[user].t === 1){
			iBot ++;
		}
	}

	if(iUfo >= iBot){
		return 1;
	}else{
		return 0;
	}
}

setInterval(statusBroadcast, 60);

http.listen(8080, function(){
	console.log("listening on *:8080");
});