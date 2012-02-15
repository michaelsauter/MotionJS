/**
 * Motion core
 * It provides one public method, create, through which new objects can be instantiated.
 * All other methods are marked as private which underpin the object creation process.
 * Some functionality depends on the host environment and is therefore provided by the respective adapter (see 
 * adapter/client.js and adapter/server.js)
 */
var motionjs = 
{ /**
   * Contains all the identifiers inherited by an identifier
   * E.g. 'demo/one': ['demo/one', 'demo/two', 'demo/three']
   */
  _inheritanceChains: {}
  
  /**
   * Contains all ability methods by identifier
   * E.g. 'demo/one': { foo: function () {} }
   */
, _abilityObjects: {}

  /**
   * The global configuration (from configuration.js) is stored here, this should be set via addConfiguration()
   */
, _configuration: {}

  /**
   * When an object is about to be created, all constructors (and their prototypes) needed to do this are created and
   * stored here by identifier
   */
, _constructors: {}

  /**
   * When a module is loaded (e.g. via require()) its contents are stored here by identifier
   */
, _modules: {}

  /**
   * Holds all shared objects
   * Every object that has shared set to true in its configuration ends up here
   */
, _sharedObjects: {}

  /**
   * Clones given object
   *
   * @param {mixed}  Object to clone
   * @param {string} Type (e.g. 'function') of properties to include
   */
, clone: function (obj, filterKeyByType) {
    if (obj == null || typeof obj != 'object') {
      return obj
    }

    var tmp = {}
    for (var key in obj) {
      if (typeof filterKeyByType != 'string' || typeof obj[key] == filterKeyByType) {
        tmp[key] = this.clone(obj[key])
      }
    }
    return tmp
  }
  
  /**
   * Creates a new object of identifier given as the first argument
   * The created object is given to the callback
   *
   * @throws {Error}  If less than two arguments are given, or the last one is not a callback
   * @return {void}
   */
, create: function () {
    // collect arguments
    var createArguments = Array.prototype.slice.call(arguments)
    if (createArguments.length < 2 && typeof createArguments[createArguments.length - 1] != 'function') {
      callback.call(null, 'You need to pass at least two arguments: One identifier and one callback', null)
    }
    var identifier = this._getRealIdentifier(createArguments.shift())
    var callback = createArguments.pop()
    // make object
    var self = this
    if (typeof this._modules[identifier] == 'undefined') {           		  
  	  this._loadModules(identifier, callback, function () {      		    	
  	    self._makeObjectWrapper(identifier, createArguments, callback)  		    
  	  })
    } else { 	  
      self._makeObjectWrapper(identifier, createArguments, callback)   	    
    }    
  }

  /**
   * Calls _makeObject to create an instance of identifier
   * If creation is successfull, it passes the created object to the callback
   * If some error occured, the error message is passed
   *
   * @param  {string}
   * @param  {array}
   * @param  {function}
   * @return {void}
   */
, _makeObjectWrapper: function (identifier, createArguments, callback) {
    var returnObject = null
      , errorMessage = undefined

    try {
      returnObject = this._makeObject(identifier, createArguments, {})
    } catch (exception) {
      errorMessage = exception.message
    }
    if (typeof callback == 'function') {
      callback.call(null, errorMessage, returnObject)
    } else {
      throw 'Last argument given to create() must be a function!'
    }
  }

  /**
   * Sets the object given in module as value of the key given in identifier
   * It ensures the given object has the properties "definition" and "configuration"
   *
   * @param  {string}
   * @param  {object}
   * @return {void}
   */
, _addModule: function (identifier, module) {
    if (typeof module.definition == 'undefined') {
      module.definition = {}
    }
    if (typeof module.configuration == 'undefined') {
      module.configuration = {}
    }
    this._modules[identifier] = module
  }

  /**
   * Applies abilities associated with identifier to given object
   * Abilities are applied in the order they are specified (from left to right)
   *
   * @param  {string}
   * @param  {object}
   * @return {void}
   */
, _applyAbilityFunctionWrappers: function (identifier, obj) {
    var abilityIdentifier
    for (var i = 0; i < this._inheritanceChains[identifier].length; i++) {
      abilityIdentifier = this._inheritanceChains[identifier][i]
  		for (var key in this._abilityObjects[abilityIdentifier]) {
  			if (typeof obj[key] == 'undefined') {
      		obj[key] = this._getAbilityFunctionWrapper(this._abilityObjects[abilityIdentifier][key]) 			    						
  			}
  		}
  	}
  }
  
  /**
   * Builds the inheritance chain of identifier and its dependencies
   * Adds the modules of the inherited identifiers to the core
   *
   * @param  {string}  A real(!) identifier for which to build the _inheritanceChains entries
   * @param  {boolean} Whether to load the modules or not (should only be true on the server)
   * @return {void}
   */
, _buildInheritanceChains: function (identifier, loadModules) {
    if (typeof this._inheritanceChains[identifier] == 'undefined') {
      
      // identifier itself
      if (loadModules) {
        this._requireModule(identifier)
      }
      this._inheritanceChains[identifier] = [identifier]

      // inherited identifiers
      if (this._modules[identifier].configuration.inherits) {
        for (var i = 0; i < this._modules[identifier].configuration.inherits.length; i++) {
          var inheritedIdentifier = this._getRealIdentifier(this._modules[identifier].configuration.inherits[i])
          this._buildInheritanceChains(inheritedIdentifier, loadModules)
          this._inheritanceChains[identifier] = 
            this._inheritanceChains[identifier].concat(this._inheritanceChains[inheritedIdentifier])
        }
      }

      // dependencies
      if (this._modules[identifier].configuration.dependencies) {
     	  for (var dependencyIdentifier in this._modules[identifier].configuration.dependencies) {
     	    this._buildInheritanceChains(this._getRealIdentifier(dependencyIdentifier), loadModules)
   	    }
 	    }
    }
  }

  /**
   * Adds the functions of each identifier to the _abilties object
   *
   * @param  {string}
   * @return {void}
   */
, _buildAbilityObjects: function (identifier) {
	  var abilityIdentifier
	  for (var i = 0; i < this._inheritanceChains[identifier].length; i++) {
	    abilityIdentifier = this._inheritanceChains[identifier][i]
	    if (typeof this._abilityObjects[abilityIdentifier] == 'undefined') {
	      this._abilityObjects[abilityIdentifier] = this.clone(this._modules[abilityIdentifier].definition, 'function')	     
	    }
    }
  }
  
  /**
   * Build the constrcutor needed to make an object of identifier
   *
   * @param  {string}
   * @return {void}
   */
, _buildConstructor: function (identifier) { 
            
    // constructor (contains all properties)
    var source = {}    
    for (var i = this._inheritanceChains[identifier].length - 1; i >= 0 ; i--) {
      var identifierModule = this._modules[this._inheritanceChains[identifier][i]]
      // set properties specified in the definition
	    for (var key in identifierModule.definition) {
	      var objectProperty = identifierModule.definition[key]
	      // only set properties that are not functions (functions are wrapped in prototype and 
	      // delegate to ability functions)
	      if (typeof objectProperty != 'function') {
	        source[key] = objectProperty
	      }
	    }	 
	  }    
    this._constructors[identifier] = function () {  
      var temp = self.clone(source)    
		  for (var key in temp) {
		    this[key] = temp[key]
		  }
  	}  	  
  	
  	// prototype (contains all methods)
  	var self = this
  	this._constructors[identifier].prototype = 
  	{	_type: identifier
  	,	isInstanceOf: function (typeName) {  		 
  			for (var i = 0; i < self._inheritanceChains[this._type].length; i++) {
  			  if (self._inheritanceChains[this._type][i] == typeName) return true
			  }
  			return false
  		}
  	,	_uber: function () {  	
  		  var methodArguments = Array.prototype.slice.call(arguments)
  		  if (methodArguments.length >= 2) {
          var abilityIdentifier = self._getRealIdentifier(methodArguments.shift())
          var methodName = methodArguments.shift()	
          // ensure typeName is one of the abilities
          if (this.isInstanceOf(abilityIdentifier)) {
    			  return self._abilityObjects[abilityIdentifier][methodName].apply(this, methodArguments)
  			  } else {
  			    throw new Error('Cannot call ' + methodName + ' on ' + abilityIdentifier + ' because ' + this._type 
  			      + ' is not a subtype of ' + abilityIdentifier)
  			  }
  			} else {
  			  throw new Error('You need to provide at least a method name and an identifier.')
  			}
  		}
  	}
  	this._applyAbilityFunctionWrappers(identifier, this._constructors[identifier].prototype)
  }
  
  /**
   * Checks requirements by going through all object configurations associated with given identifier
   *
   * @throws Error if one of the requirements associated with identifier are not met
   * @param  {string}
   * @param  {object}
   * @return {void}
   */
, _checkRequirements: function (identifier, obj) {
    var typeName, requires
    for (var i = this._inheritanceChains[identifier].length - 1; i >= 0 ; i--) {
      typeName = this._inheritanceChains[identifier][i]
      if (typeof this._modules[typeName].configuration.requires != 'undefined') {
        requires = this._modules[typeName].configuration.requires
        for (var j = 0; j < requires.length; j++) {
          if (typeof obj[requires[j]] == 'undefined') {
            throw new Error('Requirement not met: ' + typeName + ' requires ' + requires[j])
          }
        }
      }
    }
  }

  /**
   * Returns a function that delegates to given method
   *
   * @param  {function}
   * @return {void}
   */
, _getAbilityFunctionWrapper: function (method) {
    return function () {
      return method.apply(this, arguments)
    }
  }
      
  /**
   * Simple hash function
   * Can be given any number of strings as arguments
   * Original idea is taken from http://stackoverflow.com/questions/811195/fast-open-source-checksum-for-small-strings
   *
   * @return {string} A sufficiently unique sequence of digits
   */
, _getHash: function () {
  	var strings = Array.prototype.slice.call(arguments)
  	var string = strings.join(',')
  	var hash = 0x123456789

  	for (var i = 0; i < string.length; i++) {
  		hash += (string.charCodeAt(i) * i)
  	}

  	return hash
  }
  
  /**
   * Returns the real identifier of given identifier, that is the identifier itself or, if the identifier is 
   * provided by some other identifier, that identifier
   *
   * @param  {string}
   * @return {string}
   */
, _getRealIdentifier: function (identifier) {
    if (typeof this._configuration.objects[identifier] != 'undefined'
      && typeof this._configuration.objects[identifier].providedBy != 'undefined') {
      return this._configuration.objects[identifier].providedBy
    }
    return identifier
  }
  
  /**
   * Builds an object of identifier by calling the corresponding constructor
   * After the object is created, its dependencies are set and the init method is called
   *
   * @param  {string}
   * @param  {array}
   * @param  {object}
   * @return {object}
   */
, _makeObject: function (identifier, initArguments, buildContainer) {
    // if object is already in buildContainer, return it right away (enables cyclic dependencies)
    if (typeof buildContainer[identifier] != 'undefined') {      
      return buildContainer[identifier]
    }
    
    // if the object is configured as shared and already in the framework, return it right away
    if (this._modules[identifier].configuration.shared && typeof this._sharedObjects[identifier] != 'undefined') {      
      return this._sharedObjects[identifier]
    }
    
    // only objects with an init mehtod should be instantiable
    if (typeof this._modules[identifier].definition.init == 'undefined') {
      throw new Error('Cannot instantiate ' + identifier + '! No init method is defined.')
    }    
    // prepare the object creation if no constructor is available
    if (typeof this._constructors[identifier] == 'undefined') {
      this._prepareObjectCreation(identifier)
    }    
    // create new object
    var obj = buildContainer[identifier] = new this._constructors[identifier]()  
    if (this._modules[identifier].configuration.shared) {
      this._sharedObjects[identifier] = obj
    }  
    // set dependencies of object
    for (var i = 0; i < this._inheritanceChains[identifier].length; i++) {
      var inheritedIdentifier = this._inheritanceChains[identifier][i]
      for (var dependencyIdentifier in this._modules[inheritedIdentifier].configuration.dependencies) {
        var dependencyObjectKey = this._modules[inheritedIdentifier].configuration.dependencies[dependencyIdentifier]
        dependencyIdentifier = this._getRealIdentifier(dependencyIdentifier)               
  	    obj[dependencyObjectKey] = this._makeObject(dependencyIdentifier, [], buildContainer)
  	  }
  	}
  	
		// check if the constructor will set all properties that are required by the identifiers
  	this._checkRequirements(identifier, obj)
  	
	  // initialize object
	  if (typeof initArguments == 'undefined') {
	    initArguments = []
	  }
	  if (typeof this._configuration.objects[identifier] != 'undefined'
	    && typeof this._configuration.objects[identifier].defaultArguments != 'undefined'
	    && this._configuration.objects[identifier].defaultArguments.length > initArguments.length) {	    
	    var startIndex = initArguments.length
	    var endIndex = this._configuration.objects[identifier].defaultArguments.length
	    for (var i = startIndex; i < endIndex; i++) {
	      initArguments.push(this._configuration.objects[identifier].defaultArguments[i])
	    }
	  }
  	obj.init.apply(obj, initArguments)
  	delete obj.init
    
    return obj
  }
  
  /**
   * Adds modules needed to built an object of identifier to _modules
   *
   * @param  {string}
   * @return {void}
   */
, _prepareObjectCreation: function (identifier, loadModules) {   
    var realIdentifier = this._getRealIdentifier(identifier)
    this._buildInheritanceChains(realIdentifier, loadModules)
    this._buildAbilityObjects(realIdentifier)
    this._buildConstructor(realIdentifier)
  }

  /**
   * Sets the _configuration property
   *
   * @param  {object}
   * @return {void}
   */
, _setConfiguration: function (configuration) {
    this._configuration = configuration
  }
}

// on the server, we need to finish building the core object now by mixing in the server adapter, setting the
// configuration object and exporting the core object
if (typeof window == 'undefined') {
  var adapter = require('./adapter/server')
  for (var key in adapter) {
    motionjs[key] = adapter[key]
  }
  var configuration = require('./../../../configuration').configuration
  motionjs._setConfiguration(configuration)
  exports.motionjs = motionjs
}