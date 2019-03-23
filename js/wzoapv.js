// External code included:
// - Class Utilities

// ------------------------------------------------------------

function Counter() {
  "use strict";
  
  this._count = 0;
  
  // Callbacks.
  this.onCountTurningNonZero = null;
  this.onCountTurningZero = null;
}

defineCounterMethods();

function defineCounterMethods() {
  "use strict";
  
  var prototype = Counter.prototype;
  
  prototype.getCount = function () {
    return this._count;
  };
  prototype.setCount = function (count, optionalUserArgs) {
    var previousCount = this.getCount();
    
    if (count < 0) {
      throw "Count cannot be negative: " + count;
    }
    
    this._count = count;
    
    if (previousCount === 0 && this.getCount() !== 0) {
      if (hasMethod(this, "onCountTurningNonZero")) {
        this.onCountTurningNonZero(this, previousCount, optionalUserArgs);
      }
    }
    else if (previousCount !== 0 && this.getCount() === 0) {
      if (hasMethod(this, "onCountTurningZero")) {
        this.onCountTurningZero(this, previousCount, optionalUserArgs);
      }
    }
  };
  // Offset variable can be left unspecified.
  // If unspecified, a default value is chosen.
  prototype.incrementCount = function (offset, optionalUserArgs) {
    if (offset === null || offset === undefined) {
      offset = 1;
    }
    
    this.setCount(this.getCount() + offset, optionalUserArgs);
  };
}
