pc.script.create('control', function (app) {
	// Creates a new Control instance
	var Control = function (entity) {
		this.entity		= entity;
		this.camera		= null;
		this.gadget		= null;
		this.receiver	= null;			// Receiver script
		this.receiverE	= null;			// Receiver entity
		this.socket		= null;			// Socket connection
		this.sStatus	= "pre-init";	// Socket status
		this.id			= null;			// Unique id
		this.type		= -1;			// Type of player
		this.dummies	= {};			// Entities of other bots/ufos
		this.holderID	= -1;			// ID of holder
		this.victimID	= -1;			// ID of victim
		this.testIDH	= -1;			// Test ID of holder
		this.testIDV	= -1;			// Test ID of victim
		this.tempHold	= null;			// For iteration

		this.vectorX	= 0;
		this.vectorZ	= 0;
		this.yAngle		= 0;
		this.autoX		= 0;
		this.autoZ		= 0;
		this.autoTimer	= 0;
		this.autoTimerMax = getRandNo(1, 3);
	};

	Control.prototype = {
		// Called once before 1st update
		initialize: function () {
			this.camera = app.root.findByName("Cam");
			this.gadget = app.root.findByName("Gadget");
			this.sStatus = "initializing";
			this.socket = io("http://localhost:8080");
			this.socket.on("connect_error", this.sError.bind(this));
			this.socket.on("disconnect", this.sDisc.bind(this));
			this.socket.on("pCn", this.sConnected.bind(this));
			this.socket.on("pUp", this.sUpdateStatus.bind(this));
			this.changeDirection();
		},
		
		//////////////////////////////////// KEYBOARD CONTROLS ////////////////////////////////////
		// Called every frame
		update: function(dt){
			TWEEN.update();
			if(this.sStatus !== "connected" || this.receiver == null){return false;}
			this.vectorX = 0;
			this.vectorZ = 0;
			
			// WASD Controls
			if(app.keyboard.isPressed(pc.KEY_A)){
				this.vectorX --;
			}
			if(app.keyboard.isPressed(pc.KEY_D)){
				this.vectorX ++;
			}
			if(app.keyboard.isPressed(pc.KEY_W)){
				this.vectorZ --;
			}
			if(app.keyboard.isPressed(pc.KEY_S)){
				this.vectorZ ++;
			}
			if(this.vectorX !== 0 || this.vectorZ !== 0){
				this.buttonMove(dt);
			}
			else{
				this.noButtonMove();
			}
			// else{
			// 	this.autoTimer += dt;
			// 	if(this.autoTimer > this.autoTimerMax){
			// 		this.changeDirection();
			// 	}
			// 	// Auto controls
			// 	if(this.autoX === 1){
			// 		this.vectorX --;
			// 	}
			// 	if(this.autoX === 2){
			// 		this.vectorX ++;
			// 	}
			// 	if(this.autoZ === 1){
			// 		this.vectorZ --;
			// 	}
			// 	if(this.autoZ === 2){
			// 		this.vectorZ ++;
			// 	}
			// 	if(this.vectorX !== 0 || this.vectorZ !== 0){
			// 		this.buttonMove(dt);
			// 	}else{
			// 		this.noButtonMove(dt);
			// 	}
			// }

			// A Button
			if(app.keyboard.wasPressed(pc.KEY_SPACE)){
				this.receiver.btnA();
			}

			// B Button
			if(app.keyboard.wasPressed(pc.KEY_P)){
				this.receiver.btnB();
			}

			// Reset
			if(app.keyboard.wasPressed(pc.KEY_T)){
				this.receiver.reset();
			}
		},


		// Teleport to a location (goes in receiver)
		/*reset: function(){
			if(this.entity.getPosition().x > 0){
				this.entity.rigidbody.teleport(-27, 1.8, 0, 0, 0, 0);
			}else{
				this.entity.rigidbody.teleport(10, 0.3, 0, 0, 0, 0);
			}
		},*/

		buttonMove: function(dt){
			// Calculate y Angle from x & z vectors
			this.yAngle = Math.atan2(this.vectorX, this.vectorZ) * (180 / Math.PI);
			this.receiver.moveToAngle(this.yAngle, dt);
		},

		noButtonMove: function(dt){
			this.receiver.decelerate(dt);
		},

		changeDirection: function(){
			do{
				this.autoX = getRandInt(0, 3);
				this.autoZ = getRandInt(0, 3);
			}while(this.autoX === 0 && this.autoZ === 0);

			this.autoTimerMax = getRandNo(0, 2);
			this.autoTimer = 0;
		},

		//////////////////////////////////// RECEIVER BEHAVIORS ////////////////////////////////////
		// Player moved event
		receiverMoved: function(posData){
			this.socket.emit("pMv", {
				x: Math.round(posData.x * 100) / 100, 
				y: Math.round(posData.y * 100) / 100, 
				z: Math.round(posData.z * 100) / 100,
				a: this.receiver.prevAngle,
				h: this.testIDH,
				v: this.testIDV
			});
		},

		receiverBeam: function(victim){
			if(this.receiver.beamCoolDown > 0)return false;

			if(typeof(victim) === 'undefined'){
				this.testIDV = -2;
			}else{
				for(dummy in this.dummies){
					if(this.dummies[dummy] == victim){
						this.testIDV = +dummy;
						break;
					}
				}
			}
		},

		receiverPicked: function(){
			this.testIDH = this.id;
		},

		receiverDropped: function(){
			this.testIDH = -1;
		},

		//////////////////////////////////// SOCKET EVENT LISTENERS ////////////////////////////////////
		// Connected socket
		sConnected: function(newUser, allUsers, gInfo){
			this.id = newUser.id;
			this.type = newUser.t;
			this.sStatus = "connected";
			
			// Create Ufo receiver
			if(this.type === 0){
				this.receiverE = app.root.findByName("Ufo").clone();
				app.systems.script.addComponent(this.receiverE,{
					scripts: [{url: "ufo.js"}]
				});
				this.receiver = this.receiverE.script.ufo;
			}	
			// Create Bot receiver
			else{
				this.receiverE = app.root.findByName("Bot").clone();
				app.systems.script.addComponent(this.receiverE,{
					scripts: [{url: "bot.js"}]
				});
				this.receiver = this.receiverE.script.bot;
			}
			
			// Add receiver to stage
			this.receiverE.setPosition(newUser.x, newUser.y, newUser.z);
			this.receiverE.enabled = true;
			this.receiver.connect(this);
			app.root.addChild(this.receiverE);

			// Populate existing users
			for(user in allUsers){
				if(this.id !== allUsers[user].id){
					this.playerCreate(allUsers[user]);
				}
			}

			// Position existing users
			this.sUpdateStatus(allUsers);

			// Connect camera
			this.camera.script.camera.connect(this.receiverE);

			// Create gadget
			console.log("Creating gadget");
			console.log(gInfo);
			this.gadget.enabled = true;
			if(gInfo.id === -1){
				this.gadget.setPosition(gInfo.x, gInfo.y, gInfo.z);
				app.systems.script.addComponent(this.gadget, {
					scripts: [{url: "gadget.js"}]
				});
			}else{
				app.systems.script.addComponent(this.gadget, {
					scripts: [{url: "gadget.js"}]
				});
				this.gadget.script.gadget.pickedUp(this.dummies[gInfo.id]);
			}
		},

		// Disconnected
		sDisc: function(){
			// Destroy receiver
			console.log("Disconnected");
			this.gadget.script.gadget.dropped();
			this.receiver = null;
			this.receiverE.destroy();
			this.receiverE = null;
			this.sStatus = "disconnected";
			this.id = null;

			// Delete all dummies
			for(user in this.dummies){
				this.playerDestroy(user);
			}

			// Disconnect camera
			this.camera.script.camera.disconnect();
		},

		// Connection error
		sError: function(object){
			console.log("Connection error");
			this.sStatus = "disconnected";
			this.id = null;
		},

		// Update game status
		sUpdateStatus: function(allUsers){
			if(!this.gadget.script.gadget || this.receiver == null){return false};

			// Check connects/disconnects
			if(Object.keys(allUsers).length !== Object.keys(this.dummies).length + 1){
				this.playerReconcile(allUsers);
			}

			this.tempHold = allUsers[Object.keys(allUsers)[0]].h;
			// New pickup
			if(this.tempHold !== -1 && this.holderID === -1){
				this.holderID = this.tempHold;
				this.testIDH = this.tempHold;
				if(this.holderID !== this.id){
					this.gadget.script.gadget.pickedUp(this.dummies[this.tempHold]);
				}else{
					this.gadget.script.gadget.pickedUp(this.receiverE);
				}
			}

			// New dropped
			else if(this.tempHold === -1 && this.holderID !== -1){
				this.gadget.script.gadget.dropped(allUsers[this.tempHold]);
				this.holderID = -1;
				this.testIDH = -1;
			}

			// Positions
			for(user in allUsers){
				if(this.id === allUsers[user].id){
					if(allUsers[user].v === this.id && this.victimID === -1){
						this.victimID = this.id;
						this.receiver.abduct(allUsers[user]);
					}else{
						this.victimID = allUsers[user].v;
					}
					// Reset test IDV when we know server has read it
					if(this.testIDV === allUsers[user].v){this.testIDV = -1;}
					// Game over, switch players
					if(allUsers[user].t !== this.type){
						console.log("This type has changed to " + allUsers[user].t);
						this.resetPlayers(allUsers);
						return false;
					}
					continue;
				}
				
				if(allUsers[user].t === 0 && this.dummies[user].script.dumufo){// UFO
					this.dummies[user].script.dumufo.updateParams(allUsers[user]);
				}else if(this.dummies[user].script.dumbot){	// Bot
					this.dummies[user].script.dumbot.updateParams(allUsers[user]);
				}
			}
		},

		//////////////////////////////////// PLAYER CREATION ////////////////////////////////////
		// New player connected
		playerCreate: function(user){
			console.log("Creating " + user.id);
			if(user.t === 0){	// Ufo
				this.dummies[user.id] = app.root.findByName("Ufo").clone();
				app.systems.script.addComponent(this.dummies[user.id], {
					scripts: [{url: "dumufo.js"}]
				});
				this.dummies[user.id].script.dumufo.birth(user);
			}else{	// Bot
				this.dummies[user.id] = app.root.findByName("Bot").clone();
				app.systems.script.addComponent(this.dummies[user.id], {
					scripts: [{url: "dumbot.js"}]
				});
				this.dummies[user.id].script.dumbot.birth(user);
			}
		},

		// Player disconnected
		playerDestroy: function(discID){
			console.log("Destroying " + discID);
			if(this.dummies[discID].script.dumbot){
				this.dummies[discID].script.dumbot.kill();
			}else{
				this.dummies[discID].script.dumufo.kill();
			}
			delete this.dummies[discID];
		},

		// Match players to server data
		playerReconcile: function(allUsers){
			// Connect new 
			if(Object.keys(allUsers).length > Object.keys(this.dummies).length + 1){
				for(var i = 0; i < Object.keys(allUsers).length; i++){
					if(!this.dummies[Object.keys(allUsers)[i]] && Object.keys(allUsers)[i] != this.id){
						this.playerCreate(allUsers[Object.keys(allUsers)[i]]);
					}
				}
			}
			// Disconnect
			else if(Object.keys(allUsers).length < Object.keys(this.dummies).length + 1){
				for(var i = 0; i < Object.keys(this.dummies).length; i++){
					if(!allUsers[Object.keys(this.dummies)[i]] && Object.keys(this.dummies)[i] !== this.id){
						this.playerDestroy(Object.keys(this.dummies)[i]);
					}
				}
			}
		},

		resetPlayers: function(allUsers){
			this.receiver = null;
			this.receiverE.destroy();
			this.receiverE = null;

			// Delete all users
			for(user in this.dummies){
				this.playerDestroy(user);
			}

			// Disconnect camera
			this.camera.script.camera.disconnect();

			this.sConnected(allUsers[this.id], allUsers, {id: -1, x: -26, y: 1.5, z:0});
		}
	};

	return Control;
});

var blabla = {
	1: {a: 1, b: 2},
	2: {c: 3, d: 4}
}