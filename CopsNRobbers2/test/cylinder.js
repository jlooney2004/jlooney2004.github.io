pc.script.create('cylinder', function (app) {
    // Creates a new Cylinder instance
    var Cylinder = function (entity) {
        this.entity = entity;
    };

    Cylinder.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            this.entity.collision.on("triggerenter", function(){console.log("Cylinder enter");});
        }
    };

    return Cylinder;
});