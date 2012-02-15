exports.definition = 
{ colour: ''
, init: function (colour) {
    this.colour = colour
  }
}

exports.configuration = 
{ inherits: ['org.motionjs.demo/model/vehicle']
, dependencies: 
  { 'org.motionjs.demo/model/engine': '_engine' }
}