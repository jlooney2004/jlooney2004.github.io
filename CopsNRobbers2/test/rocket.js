pc.script.attribute("thrust", "number", 350);
pc.script.attribute("torque", "number", 40);

pc.script.create('player', function (app) {
	// Creates a new Player instance
	var Player = function (entity) {
		this.entity = entity;
		this.dead = false;

		this.thrustVec = new pc.Vec3();
		this.thrusting = false;
		this.prop = null;
		this.glow = null;
	};

	Player.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function () {
			this.prop = this.entity.findByName("Prop");
			this.glow = this.entity.findByName("PropGlow");
			this.prop.enabled = false;
			this.glow.enabled = false;
			this.trigger = app.root.findByName("Trigger");

			this.trigger.collision.on("triggerenter", this.onTrigger, this);
			this.entity.collision.on("collisionstart", this.onCollision, this);
		},

		// Called every frame, dt is time in seconds since last update
		update: function (dt) {
			if(this.dead)return;

			if(app.keyboard.isPressed(pc.input.KEY_A)){
				this.entity.rigidbody.applyTorqueImpulse(0, 0, this.torque);
			}
			if(app.keyboard.isPressed(pc.input.KEY_D)){
				this.entity.rigidbody.applyTorqueImpulse(0, 0, -this.torque);
			}
			if(app.keyboard.isPressed(pc.input.KEY_SPACE)){
				this.startThrusting();
			}else{
				this.stopThrusting();
			}
			if(app.keyboard.isPressed(pc.input.KEY_R)){
				this.reset();
			}
		},

		explode:function(){
			if(!this.dead){
				this.dead = true;

				this.prop.enabled = false;
				this.glow.enabled = false;
				this.entity.audiosource.loop = false;
				this.entity.audiosource.play("explode");

				setTimeout(function(){
					this.reset();
				}.bind(this), 4000);
			}
		},

		onCollision:function(result){
			if(result.other.getName() === "Asteroid"){
				this.explode();
			}
		},

		onTrigger:function(other){
			if(this.entity === other){
				this.explode();
			}
		},

		reset: function(){
			this.dead = false;
			this.entity.setPosition(-12, 5, 0);
			this.entity.setEulerAngles(0, 0 , 0);
			this.entity.rigidbody.syncEntityToBody();

			this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
			this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
		},

		startThrusting: function(){
			this.thrustVec.copy(this.entity.up).scale(this.thrust);
			this.entity.rigidbody.applyImpulse(this.thrustVec);

			if(this.thrusting === false){
				this.thrusting = true;
				this.prop.enabled = true;
				this.glow.enabled = true;

				this.entity.audiosource.loop = true;
				this.entity.audiosource.play("thruster");
			}
		},

		stopThrusting: function(){
			if(this.thrusting === true){
				this.thrusting = false;
				this.prop.enabled = false;
				this.glow.enabled = false;

				this.entity.audiosource.stop();
			}
		}
	};

	return Player;
});