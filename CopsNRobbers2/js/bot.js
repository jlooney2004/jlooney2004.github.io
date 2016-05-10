pc.script.create('bot', function (app) {
	// Creates a new Bot instance
	var Bot = function (entity) {
		// Robot parts
		this.entity		= entity;
		this.controller = null;
		this.beamParticle = null;
		this.faceMaterial = null;

		// Physics vars
		this.TIME_MULT	= 1;				// Time multiplier (for slo-mo)
		this.velocity	= 0;				// Current velocity
		this.ACCEL		= 0.002;			// Acceleration
		this.MAX_VEL	= 0.07;				// Maximum velocity

		// Tween variables
		this.quatNow	= new pc.Quat();	// Current angle
		this.quatTrg	= new pc.Quat();	// Target angle
		this.prevAngle	= -90;
		this.animVars	= {rotateI: 0};
		this.twRotate	= new TWEEN.Tween(this.animVars).easing(Ez.Sin.O);
		this.heartbeat	= null;
	};

	Bot.prototype = {
		initialize: function(){
			this.quatNow 	= this.entity.getRotation();
			this.faceMaterial = this.entity.findByName("BotModel").model.model.meshInstances[1].material;
			this.beamParticle = this.entity.findByName("BeamUp").particlesystem;
			this.entity.collision.on("triggerenter", this.onTriggerEnter.bind(this));
			this.entity.collision.on("triggerleave", this.onTriggerLeave.bind(this));
		},

		destroy: function(){
			if(this.heartbeat != 0){
				clearInterval(this.heartbeat);
			}
		},

		///////////////////////////////////// CONTROL LISTENERS /////////////////////////////////////
		// Connect to controller
		connect: function(controller){
			this.controller = controller;
			this.heartbeat = setInterval(function(){
				this.controller.receiverMoved(this.entity.getPosition());
			}.bind(this), 60);
		},

		// Bot will move toward angle
		moveToAngle: function(yAngle, dt){
			if(yAngle !== this.prevAngle){
				this.animVars.rotateI = 0;
				this.prevAngle = yAngle;
				this.twRotate.to({rotateI: 1}, 1000).start();
				this.quatTrg.setFromAxisAngle(pc.Vec3.UP, yAngle);
			}

			this.entity.setRotation(this.quatNow.slerp(this.quatNow, this.quatTrg, this.animVars.rotateI));

			this.velocity += this.ACCEL;
			this.velocity = Math.min(this.velocity, this.MAX_VEL);
			this.entity.translateLocal(0, 0, this.velocity);
			this.entity.rigidbody.syncEntityToBody();
		},

		// Decelerates when no button is pressed
		decelerate: function(dt){
			if(this.velocity === 0) return false;

			this.velocity -= this.ACCEL;
			this.velocity = Math.max(this.velocity, 0);

			this.entity.translateLocal(0, 0, this.velocity);
			this.entity.rigidbody.syncEntityToBody();
		},

		enterDanger: function(){
			this.faceMaterial.emissive = new pc.Vec3(1, 0, 0);
			this.faceMaterial.update();
		},

		exitDanger: function(){
			this.faceMaterial.emissive = new pc.Vec3(0, 0.56, 1);
			this.faceMaterial.update();
		},

		btnA: function(){
			this.controller.receiverDropped();
		},

		btnB: function(){

		},

		///////////////////////////////////// EVENT LISTENERS /////////////////////////////////////
		// When being abducted
		abduct: function(){
			this.entity.setPosition((Math.random() < 0.5) ? -1 : 1, 1.8, (Math.random() < 0.5) ? -1 : 1);
			this.entity.rigidbody.syncEntityToBody();
			this.beamParticle.reset();
			this.beamParticle.play();
			this.velocity = 0;
		},

		onTriggerEnter: function(result){
			switch(result.getName()){
				case "Ufo":
					this.enterDanger();
				break;
				case "Gadget":
					this.controller.receiverPicked();
				break;
			}
		},

		onTriggerLeave: function(result){
			switch(result.getName()){
				case "Ufo":
					this.exitDanger();
				break;
				case "Gadget":
				break;
			}
		}
	};

	return Bot;
});


