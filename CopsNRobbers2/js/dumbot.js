pc.script.create('dumbot', function (app) {
	// Creates a new Bot instance
	var Dumbot = function (entity) {
		this.entity		= entity;
		this.itemCarry	= null;					// Will contain gadget
		this.faceMaterial = null;
		this.beamParticle = null;

		// Tween variables
		this.animVars	= {x: 26, y: 10, z: 0, i: 0};
		this.twTransl	= new TWEEN.Tween(this.animVars).easing(Ez.Lin.None);
		this.twRotate	= new TWEEN.Tween(this.animVars).easing(Ez.Sin.O);
		this.quatNow 	= new pc.Quat();	// Current angle
		this.quatTrg 	= new pc.Quat();	// Target angle
		this.prevAngle	= 0;
		this.beamStat 	= -1;
	};

	Dumbot.prototype = {
		initialize: function(){
			this.quatNow 	= this.entity.getRotation();
			this.beamParticle = this.entity.findByName("BeamUp").particlesystem;
			this.faceMaterial = this.entity.findByName("BotModel").model.model.meshInstances[1].material;
			this.entity.collision.on("triggerenter", this.onTriggerEnter.bind(this));
			this.entity.collision.on("triggerleave", this.onTriggerLeave.bind(this));
		},

		update: function(dt){
			this.entity.setPosition(this.animVars.x, this.animVars.y, this.animVars.z);
			this.entity.setRotation(this.quatNow.slerp(this.quatNow, this.quatTrg, this.animVars.i));
			this.entity.rigidbody.syncEntityToBody();
		},

		updateParams: function(user){
			this.twTransl.to({
				x: user.x,
				y: user.y,
				z: user.z
			}, 60).start();

			if(user.a !== this.prevAngle){
				this.animVars.i = 0;
				this.prevAngle = user.a;
				this.twRotate.to({i: 1}, 1000).start();
				this.quatTrg.setFromAxisAngle(pc.Vec3.UP, user.a);
			}

			// Abducted
			if(user.v !== -1 && this.beamStat === -1){
				this.beamStat = user.v;
				setTimeout(function(){this.fireBeam();}.bind(this), 200);
			}// Reset beam
			else if(user.v == -1){
				this.beamStat = -1;
			}
		},

		birth: function(user){
			this.entity.enabled = true;
			app.root.addChild(this.entity);
			this.entity.rigidbody.type = pc.BODYTYPE_KINEMATIC;
			this.entity.setPosition(user.x, user.y + 10, user.z);
			this.entity.rigidbody.syncEntityToBody();
			this.animVars.x = user.x;
			this.animVars.y = user.y + 10;
			this.animVars.z = user.z;
		},

		kill: function(){
			this.twTransl.to({
				y: 20,
			}, 2000).easing(Ez.Pow2.I).start();

			this.animVars.i = 0;
			this.prevAngle += 180;
			this.twRotate.to({i: 1}, 1000).easing(Ez.Sin.I).start();
			this.quatTrg.setFromAxisAngle(pc.Vec3.UP, this.prevAngle);
			setTimeout(function(){
				this.entity.destroy();
			}.bind(this), 2000);
		},

		///////////////////////////////////// EVENT LISTENERS /////////////////////////////////////
		fireBeam: function(){
			this.beamParticle.reset();
			this.beamParticle.play();
		},

		enterDanger: function(){
			this.faceMaterial.emissive = new pc.Vec3(1, 0, 0);
			this.faceMaterial.update();
		},

		exitDanger: function(){
			this.faceMaterial.emissive = new pc.Vec3(0, 0.56, 1);
			this.faceMaterial.update();
		},

		abduct: function(){
			// Drop item being carried
		},

		onTriggerEnter: function(result){
			switch(result.getName()){
				case "Ufo":
					this.enterDanger();
				break;
			}
		},

		onTriggerLeave: function(result){
			switch(result.getName()){
				case "Ufo":
					this.exitDanger();
				break;
			}
		}
	};

	return Dumbot;
});


