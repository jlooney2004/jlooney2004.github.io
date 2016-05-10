pc.script.create('ball', function (app) {
    // Creates a new Ball instance
    var Ball = function (entity) {
        this.entity = entity;
        this.oldPos = null;
        this.newPos = null;
        this.posTimer = 0;
        this.controller = null;
    };

    Ball.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            this.entity.collision.on("triggerenter", function(){console.log("Sphere enter");});
            this.newPos = this.entity.getPosition();
            this.oldPos = new pc.Vec3();
        },

        update: function(dt){
            this.entity.setEulerAngles(0,0,0);
            this.newPos = this.entity.getPosition();

            this.posTimer += dt;
            if(this.posTimer >= 0.2 && !this.newPos.equals(this.oldPos)){
                this.oldPos = this.newPos.clone();
                this.controller.receiverMoved();
                this.posTimer = 0;
            }
        },

        introduce: function(controller){
            this.controller = controller;
        },

        up: function(){
            this.entity.translateLocal(0, 0, -0.1);
            this.updatePosition();
        },

        dn: function(){
            this.entity.translateLocal(0, 0, 0.1);
            this.updatePosition();
        },

        lf: function(){
            this.entity.translateLocal(-0.1, 0, 0);
            this.updatePosition();
        },

        rt: function(){
            this.entity.translateLocal(0.1, 0, 0);
            this.updatePosition();
        },

        updatePosition: function(){
            // this.entity.rigidbody.syncEntityToBody();
        }
    };

    return Ball;
});