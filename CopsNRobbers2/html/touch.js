// Var declaration
var cardinals = document.getElementsByClassName("st5");
var btnA = document.getElementById("btnA");
var touched = null;
var oldTouched = null;

// Event binding
for(var i = 0; i < 8; i++){
	cardinals[i].addEventListener("touchstart", cardinalTouched, false);
	cardinals[i].addEventListener("touchend", cardinalEnd, false);
	cardinals[i].addEventListener("touchmove", cardinalMoved, false);
}
btnA.addEventListener("touchstart", pressA, false);
btnA.addEventListener("touchend", releaseA, false);

// Event listeners
function cardinalTouched(evt){
	oldTouched = evt.target;
	touched = evt.target;
	evt.target.classList.add("active");
	evt.preventDefault();
}
function cardinalEnd(evt){
	touched.classList.remove("active");
	evt.preventDefault();
}
function cardinalMoved(evt){
	touched = document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY);
	if(oldTouched != touched){
		oldTouched.classList.remove("active");
		oldTouched = touched;
		touched.classList.add("active");
	}
}
function pressA(evt){
	btnA.classList.add("pressed");
}
function releaseA(evt){
	btnA.classList.remove("pressed");
}