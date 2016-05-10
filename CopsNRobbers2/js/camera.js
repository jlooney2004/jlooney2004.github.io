pc.script.create('camera', function (app) {
	// Creates a new Camera instance
	var Camera = function (entity) {
		this.entity = entity;
		this.status = "disconnected";
		this.focus = null;
		this.lookat = null;
		this.player = null;
		this.gadget = null;

		this.vecTarget = new pc.Vec3();
		this.vecActual = new pc.Vec3();
		this.vecLerp = new pc.Vec3();
		this.preFocusTimer = 2;
	};

	Camera.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function () {
			this.gadget = app.root.findByName("Gadget");
			this.vecActual = this.entity.getPosition();
		},
		
		postUpdate: function(dt){
			if(this.focus === null){return false;}

			if(this.preFocusTimer > 3){
				this.preFocusTimer -= dt;
			}else if(this.preFocusTimer > 0){
				this.preFocusTimer -= dt;
				this.focus = this.player;
			}else{
				this.lookat = this.player;
			}

			this.vecTarget = this.focus.getPosition();
			this.vecTarget.x /= 1.2;
			this.vecTarget.y = 10;
			this.vecTarget.z = (this.vecTarget.z + 15);
			this.vecActual.lerp(this.vecActual, this.vecTarget, dt);
			this.entity.setPosition(this.vecActual);
			this.entity.lookAt(this.lookat.getPosition());
		},

		// Focus on player
		connect: function(focus){
			this.status = "connected";
			this.player = focus;
			this.focus = this.gadget;
			this.lookat = this.gadget;
			this.vecTarget = this.focus.getPosition();
			this.vecTarget.y =  10;
			this.preFocusTimer = 6;
		},

		// Focus on stage
		disconnect: function(focus){
			this.status = "disconnected";
			this.focus = app.root.findByName("GLight");
		}
	};

	return Camera;
});