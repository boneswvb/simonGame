// Support for inheritance.
function subTypeInheritsPrototypeFromSuperType(subType, superType) {
  "use strict";
  
  var prototype = Object.create(superType.prototype); // Prototypal inheritance.
  prototype.constructor = subType;  // Augment to mimic default prototype property of functions.
  subType.prototype = prototype;  // Switch out old with new prototype.
}

function hasMethod(obj, methodName) {
  "use strict";
  
  return methodName in obj && typeof obj[methodName] === "function";
}
