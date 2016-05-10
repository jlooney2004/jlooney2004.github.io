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

		// this.btns		= {up: false, dn: false, left: false, right: false};
		this.vectorX	= 0;
		this.vectorZ	= 0;
		this.yAngle		= 0;
		this.autoX		= 0;
		this.autoZ		= 0;
		this.autoTimer	= 0;
		this.autoTimerMax = getRandNo(1, 3);

		// Mobile touch elements
		this.cardinals = [];
		this.btnA = null;
		this.touched = null;
		this.oldTouched = null;
	};

	Control.prototype = {
		// Called once before 1st update
		initialize: function () {
			this.camera = app.root.findByName("Cam");
			this.gadget = app.root.findByName("Gadget");
			this.sStatus = "initializing";
			this.changeDirection();
			this.loadHUD();
		},

		//////////////////////////////////// KEYBOARD CONTROLS ////////////////////////////////////
		// Called every frame
		update: function(dt){
			TWEEN.update();
			if(this.sStatus !== "connected" || this.receiver == null){return false;}

			// If not touch device
			if(!('ontouchstart' in window || navigator.maxTouchPoints)){
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
			}
			
			if(this.vectorX !== 0 || this.vectorZ !== 0){
				this.buttonMove(dt);
			}
			else{
				this.noButtonMove();
			}

			// A Button
			if(app.keyboard.wasPressed(pc.KEY_SPACE)){
				this.receiver.btnA();
			}

			// B Button
			if(app.keyboard.wasPressed(pc.KEY_P)){
				this.receiver.btnB();
			}
		},

		calculateVectors: function(){

		},

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
		sConnect: function(){
			console.log("Connecting...");
			this.socket = io("http://192.232.206.48:8080");
			// this.socket = io("http://localhost:8080");
			this.socket.on("connect_error", this.sError.bind(this));
			this.socket.on("disconnect", this.sDisc.bind(this));
			this.socket.on("pCn", this.sConnected.bind(this));
			this.socket.on("pUp", this.sUpdateStatus.bind(this));
		},

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

			this.sConnected(allUsers[this.id], allUsers, {id: -1, x: 0, y: 1.5, z: -19});
		},

		loadHUD: function(){
			// get asset from registry by id
			var htmlAsset = app.assets.get(3742526);

			if(!htmlAsset.resource){
				app.assets.once("load:3742526", function (asset) {
					var div = document.createElement('div');
					div.innerHTML = htmlAsset.resource || '';
					document.body.appendChild(div);
					var btnOK = document.getElementById("okBtn");
					btnOK.addEventListener("click", function(){
						this.sConnect();
						btnOK.parentNode.parentNode.classList.add("hidden");
					}.bind(this), false);
					this.mobileAdjusts();
				}.bind(this));

				app.assets.load(htmlAsset);
			}else{
				console.log("Already loaded");
			}
		},

		mobileAdjusts: function(){
			if('ontouchstart' in window || navigator.maxTouchPoints){
				// Var declaration
				this.cardinals = document.getElementsByClassName("st5");
				this.btnA = document.getElementById("btnA");

				document.getElementById("cardinals").classList.add("visible");
				this.btnA.classList.add("visible");
				// Event binding
				for(var i = 0; i < 8; i++){
					this.cardinals[i].addEventListener("touchstart", cardinalTouched.bind(this), false);
					this.cardinals[i].addEventListener("touchend", cardinalEnd.bind(this), false);
					this.cardinals[i].addEventListener("touchmove", cardinalMoved.bind(this), false);
				}
				this.btnA.addEventListener("touchstart", pressA.bind(this), false);
				this.btnA.addEventListener("touchend", releaseA.bind(this), false);

				// Event listeners
				function cardinalTouched(evt){
					this.oldTouched = evt.target;
					this.touched = evt.target;
					evt.target.classList.add("active");
					this.mobileVectors(this.touched.id);
					evt.preventDefault();
				}
				function cardinalEnd(evt){
					this.touched.classList.remove("active");
					this.mobileVectors();
					evt.preventDefault();
				}
				function cardinalMoved(evt){
					this.touched = document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY);
					if(this.oldTouched != this.touched){
						this.oldTouched.classList.remove("active");
						this.oldTouched = this.touched;
						this.touched.classList.add("active");
					}
					this.mobileVectors(this.touched.id);
				}
				function pressA(evt){
					this.btnA.classList.add("pressed");
					this.receiver.btnA();
				}
				function releaseA(evt){
					this.btnA.classList.remove("pressed");
				}
			}
		},

		mobileVectors: function(vectorID){
			switch(vectorID){
				case "tN":
					this.vectorZ = -1;
					this.vectorX = 0;
				break;
				case "tNE":
					this.vectorZ = -1;
					this.vectorX = 1;
				break;
				case "tE":
					this.vectorZ = 0;
					this.vectorX = 1;
				break;
				case "tSE":
					this.vectorZ = 1;
					this.vectorX = 1;
				break;
				case "tS":
					this.vectorZ = 1;
					this.vectorX = 0;
				break;
				case "tSW":
					this.vectorZ = 1;
					this.vectorX = -1;
				break;
				case "tW":
					this.vectorZ = 0;
					this.vectorX = -1;
				break;
				case "tNW":
					this.vectorZ = -1;
					this.vectorX = -1;
				break;
				default:
					this.vectorZ = 0;
					this.vectorX = 0;
				break;
			}
		}
	};

	return Control;
});

var blabla = {
	1: {a: 1, b: 2},
	2: {c: 3, d: 4}
}