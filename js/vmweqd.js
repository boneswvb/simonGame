function TimeoutPool() {
  "use strict";
  
  this._pendingTimeoutIds = new Set();
}

defineTimeoutPoolMethods();

function defineTimeoutPoolMethods() {
  "use strict";
  
  var prototype = TimeoutPool.prototype;
  
  prototype.scheduleTimeout = function (func, delay) {
    var thisTimeoutPool = this;
    let timeoutId = setTimeout(function () {
      thisTimeoutPool._pendingTimeoutIds.delete(timeoutId);

      func();
    }, delay);
    
    this._pendingTimeoutIds.add(timeoutId);
  };
  prototype.clearPendingTimeouts = function () {
    // Cancel all timeouts for timer.
    while (this._pendingTimeoutIds.size > 0) {
      let iter = this._pendingTimeoutIds.values();
      let result = iter.next();
      clearTimeout(result.value);

      this._pendingTimeoutIds.delete(result.value);
    }
  };
}
