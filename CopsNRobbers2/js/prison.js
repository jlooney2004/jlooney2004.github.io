pc.script.create('prison', function (app) {
	// Creates a new Prison instance
	var Prison = function (entity) {
		this.entity = entity;
		// Doors
		this.doorT  = null;
		this.doorB  = null;
		this.doorL  = null;
		this.doorR  = null;
		// Tweens
		this.twVars = {doorY: 1.6};
		this.twDoor = new TWEEN.Tween(this.twVars);

		this.bCount = 0;
	};

	Prison.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function(){
			this.doorT = this.entity.findByName("DoorT");
			this.doorB = this.entity.findByName("DoorB");
			this.doorL = this.entity.findByName("DoorL");
			this.doorR = this.entity.findByName("DoorR");

			this.entity.findByName("TrigT").collision
				.on("triggerenter", this.onTriggerEnter.bind(this))
				.on("triggerleave", this.onTriggerLeave.bind(this));
			this.entity.findByName("TrigB").collision
				.on("triggerenter", this.onTriggerEnter.bind(this))
				.on("triggerleave", this.onTriggerLeave.bind(this));
			this.entity.findByName("TrigL").collision
				.on("triggerenter", this.onTriggerEnter.bind(this))
				.on("triggerleave", this.onTriggerLeave.bind(this));
			this.entity.findByName("TrigR").collision
				.on("triggerenter", this.onTriggerEnter.bind(this))
				.on("triggerleave", this.onTriggerLeave.bind(this));
		},

		update: function(dt){
			this.doorT.setPosition(2.2, this.twVars.doorY, -4.75);
			this.doorB.setPosition(-2.2, this.twVars.doorY, 4.75);
			this.doorL.setPosition(-4.75, this.twVars.doorY, -2.2);
			this.doorR.setPosition(4.75, this.twVars.doorY, 2.2);
		},

		onTriggerEnter: function(result){
			if(result.collision) {result.collision.fire("triggerenter", this.entity);}
			if(result.getName() === "Bot"){
				this.bCount ++;
			}
			if(this.bCount > 0){
				this.twDoor.to({doorY: 1.01}, 500).easing(Ez.Sin.IO).start();
			}
		},

		onTriggerLeave: function(result){
			if(result.collision) {result.collision.fire("triggerleave", this.entity);}
			if(result.getName() === "Bot"){
				this.bCount --;
			}

			if(this.bCount === 0){
				this.twDoor.to({doorY: 1.6}, 500).easing(Ez.Sin.IO).start();
			}
		}
	};

	return Prison;
});