pc.script.create('gadget', function (app) {
	// Creates a new Gadget instance
	var Gadget = function (entity) {
		this.entity = entity;
		// Tweens
		this.animVars	= {yPos: 1.5, yAngle: 0};
		this.twHover	= new TWEEN.Tween(this.animVars);
		this.twRotate	= new TWEEN.Tween(this.animVars);
		// Status
		this.captured	= false;	// Captured or not
		this.holder		= null;		// Entity holding this gadget

		this.posStart	= new pc.Vec3();
		this.posTarget	= new pc.Vec3();
		this.posOnBot	= new pc.Vec3(0, 0.3, 0.3);
		this.posOnUfo	= new pc.Vec3(0, 0, 0);
	};

	Gadget.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function () {
			this.posStart = this.entity.getPosition();
			this.posTarget = this.posStart;
			this.entity.collision.on("triggerenter", this.onTriggerEnter.bind(this));
			this.entity.collision.on("triggerleave", this.onTriggerLeave.bind(this));
			this.startHoverAnim();
		},

		// Called every frame, dt is time in seconds since last update
		update: function (dt) {
			// console.log(this.twHover.isPlaying);
			this.entity.setLocalPosition(this.posTarget.x, this.animVars.yPos, this.posTarget.z);
			this.entity.setLocalEulerAngles(0, this.animVars.yAngle, 0);
			// console.log("pos: " + this.posTarget.toString());
		},

		startHoverAnim: function(){
			this.twHover.to({yPos: this.posTarget.y + 1}, 2000).easing(Ez.Sin.IO).repeat(Infinity).yoyo(true).start();
			this.twRotate.to({yAngle: 359}, 4000).easing(Ez.Lin.None).repeat(Infinity).start();
		},

		pickedUp: function(newHolder){
			if(this.captured)return false;

			this.captured = true;
			this.holder = newHolder;
			this.animVars.yPos = this.entity.getPosition().y - this.holder.getPosition().y;
			this.entity.reparent(this.holder);
			this.posTarget = this.posOnBot.clone();
			this.twHover.to({yPos: -0.3}, 250).easing(Ez.Pow2.O).repeat(0).start();
			this.twRotate.to({yAngle: 0}, 250).repeat(0).easing(Ez.Pow2.O).start();
		},

		dropped: function(gPos){
			if(this.captured === false || this.holder === null) return false;

			if(gPos == undefined){
				this.posTarget = this.holder.getPosition().clone();
				this.posTarget.y -= 0.3;
			}else{
				this.posTarget.x = gPos.x;
				this.posTarget.y = gPos.y;
				this.posTarget.z = gPos.z;
			}
			this.entity.reparent(app.root.findByName("Root"));
			this.animVars.yPos = this.posTarget.y;
			this.startHoverAnim();
			this.holder = null;
			setTimeout(function(){this.decaptured();}.bind(this), 1000);
		},

		decaptured: function(){
			this.captured = false;
		},

		///////////////////////////////////// EVENT LISTENERS /////////////////////////////////////
		onTriggerEnter: function(result){
			if(this.captured) return false;
			if(result.collision){result.collision.fire("triggerenter", this.entity);}

			switch(result.getName()){
				case "Bot":
				break;
				case "UFO":
				break;
			}
		},

		onTriggerLeave: function(result){
			if(result.collision){result.collision.fire("triggerleave", this.entity);}

			switch(result.getName()){
				case "Bot":
				break;
				case "UFO":
				break;
			}
		}
	};

	return Gadget;
});