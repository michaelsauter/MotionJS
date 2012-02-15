var motionjs = require('./../../org.motionjs.core/lib/core').motionjs

var car = motionjs.create('org.motionjs.demo/model/car', 'red', function (error, car) {
  console.log(car)
})