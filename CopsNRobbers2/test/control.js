pc.script.create('control', function (app) {
	// Creates a new Control instance
	var Control = function (entity) {
		this.entity = entity;
		this.receiver = null;
		this.socket = null;
		this.id = null;
		this.sStatus = "pre-init";
		this.coPlayers = {};
	};

	Control.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function () {
			this.sStatus = "initializing";
			this.socket = io("http://192.232.206.48:8080");
			this.socket.on("connect_error", this.sError.bind(this));
			this.socket.on("disconnect", this.sDisc.bind(this));
			this.socket.on("pCn", this.sConnected.bind(this));	// Connected
			this.socket.on("pNw", this.sPlayNew.bind(this));	// Players new
			this.socket.on("pDs", this.sPlayDsc.bind(this));	// Players disconnected
			this.socket.on("pUp", this.sPlayUpd.bind(this));	// Players update
		},

		// Called every frame, dt is time in seconds since last update
		update: function (dt) {
			if(this.sStatus !== "connected"){return false;}
			if(this.receiver == null){return false;}

			if(app.keyboard.isPressed(pc.KEY_W)){
				this.receiver.script.ball.up();
			}
			if(app.keyboard.isPressed(pc.KEY_A)){
				this.receiver.script.ball.lf();
			}
			if(app.keyboard.isPressed(pc.KEY_S)){
				this.receiver.script.ball.dn();
			}
			if(app.keyboard.isPressed(pc.KEY_D)){
				this.receiver.script.ball.rt();
			}
		},

		// Emit player moved event
		receiverMoved: function(){
			this.socket.emit("pMv", {
				x: this.receiver.getPosition().x, 
				y: this.receiver.getPosition().y, 
				z: this.receiver.getPosition().z
			});
		},

		///////////////////////////////////////// SOCKET EVENTS /////////////////////////////////////////
		// Connected socket
		sConnected: function(id, allUsers){
			this.id = id;
			this.sStatus = "connected";
			
			// Create a receiver entity
			this.receiver = app.root.findByName("Sphere").clone();
			this.receiver.setPosition(0, 1, 0);
			this.receiver.enabled = true;
			app.systems.script.addComponent(this.receiver,{
				scripts: [{url: "ball.js"}]
			});
			this.receiver.script.ball.introduce(this);
			app.root.addChild(this.receiver);

			// Populate with existing users
			for(user in allUsers){
				if(this.id === allUsers[user].id){
					continue;
				}else{
					this.sPlayNew(allUsers[user].id);
				}
			}

			// Position existing users
			this.sPlayUpd(allUsers);
		},

		// Connection error
		sError: function(object){
			console.log("Connection error");
			this.sStatus = "disconnected";
			this.id = null;
		},

		// Disconnected
		sDisc: function(){
			console.log("Disconnected");
			this.receiver.destroy();
			this.receiver = null;
			this.sStatus = "disconnected";
			this.id = null;
		},

		// New player entered the arena
		sPlayNew: function(id){
			console.log("New player created: " + id);
			this.coPlayers[id] = app.root.findByName("Sphere").clone();
			this.coPlayers[id].setPosition(0, 1, 0);
			this.coPlayers[id].enabled = true;
			app.root.addChild(this.coPlayers[id]);
			console.log(this.coPlayers[id]);
		},

		// Player disconnected
		sPlayDsc: function(id){
			console.log("Player disconnected: " + id);
			this.coPlayers[id].destroy();
			delete this.coPlayers[id];
		},

		// Player update
		sPlayUpd: function(allUsers){
			for(user in allUsers){
				if(this.id === allUsers[user].id){continue;}

				if(this.coPlayers[allUsers[user].id]){
					this.coPlayers[allUsers[user].id].setPosition(
						allUsers[user].x,
						allUsers[user].y,
						allUsers[user].z
					);
				}
			}
		}
	};

	return Control;
});