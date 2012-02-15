var clearCore = function (core) {
  var x = {objects: {}, 'mode': 'development'}
  core._capabilityChains = {}
  core_capabilities = {} 
  core._configuration = x
  core._constructors = {}
  core._modules = {}
  return core
}

testSuite['Object creation'] = nodeunit.testCase({
  setUp: function (callback) {
    this.motionjs = clearCore(motionjs) // here we need to make a clean copy
    this.motionjs._configuration.a = 'z'
    callback()
  }
, tearDown: function (callback) {
    this.motionjs = null
    callback()
  }
, 'A car can be created': function (test) {
    this.motionjs.create('org.motionjs.demo/model/car', 'red', function (error, car) {
      test.equals(car._position, 0)
      test.equals(typeof this.motionjs._modules['org.motionjs.demo/model/car'], 'object')
      test.expect(2)
      test.done()
    })
  }
})

testSuite['Some other function'] = nodeunit.testCase({
  setUp: function (callback) {
    this.motionjs = clearCore(motionjs)
    callback()
  }
, tearDown: function (callback) {
    this.motionjs = null
    callback()
  }
, 'core is a copy': function (test) {
    test.equals(typeof this.motionjs._modules['org.motionjs.demo/model/car'], 'undefined')
    test.equals(typeof this.motionjs._configuration.a, 'undefined')
    test.expect(2)
    test.done()
  }
})