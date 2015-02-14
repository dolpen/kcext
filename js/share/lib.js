// optionals

Optional = function(o){
    this.obj = o;
};
Optional.prototype = {
    isPresent : function(){
        return this.obj != null;
    },
    ifPresent : function(func){
        if(this.isPresent())func(this.obj);
        return this;
    },
    orElse : function(o){
        return this.isPresent()?this.obj:o;
    }
};

// arrays


Array.prototype.filter = function (f) {
    var l = this.length, r = [];
    for (var i = 0; i < l; i++) if(f(this[i]))r.push(this[i]);
    return r;
};
Array.prototype.map = function (f) {
    var l = this.length, r = [];
    for (var i = 0; i < l; i++) r.push(f(this[i]));
    return r;
};
Array.prototype.each = function (f) {
    var l = this.length;
    for (var i = 0; i < l; i++) f(this[i]);
    return this;
};
Array.prototype.eachWithIndex = function (f) {
    var l = this.length;
    for (var i = 0; i < l; i++) f(i,this[i]);
    return this;
};
Array.prototype.any = function (f) {
    var l = this.length;
    for (var i = 0; i < l; i++) if(f(this[i])) return true;
    return false;
};
Array.prototype.tohash = function (f) {
    var l = this.length, r = {};
    for (var i = 0; i < l; i++) r[f(this[i])]=this[i];
    return r;
};
Array.prototype.first = function (f) {
    var l = this.length;
    for (var i = 0; i < l; i++) if(f(this[i])) return new Optional(this[i]);
    return new Optional(null);
};