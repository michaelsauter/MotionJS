var testUtils = require('./../../../org.motionjs.core/lib/test/testUtils')

exports['object creation 1'] = testUtils.testCase(
{
  setUp: function (callback) {
    this.core = testUtils.getFreshModule('org.motionjs.core/lib/core').motionjs
    callback()
  }
, tearDown: function (callback) {
    this.core = null
    callback()
  }
, 'loading an unknown identifier throws an exception': function (test) {
    test.throws(function () { var obj = this.core.create('test/notExistent') }, Error) 
    test.expect(1)
    test.done()
  }
})

var fakeIdentifiers1 = 
{ 'test/foo1': 
  { definition: 
    { bar: true
    , foo1_testObject: {foo:'foo'}
    , foo1_name: 'foo1'
    , baz: function () {
        return 'baz'
      }
    , init: function () {}
    }
  , configuration: {}
  }
, 'test/foo2': 
  { definition: 
    { bar: false
    , foo2_name: 'foo2'
    , baz: function () {
        return 'foo2 + ' + this._uber('test/foo3', 'baz', 'foo3_baz') 
      }
    , baz2: function () {
        return 'foo2 + ' + this._uber('test/doesNotExists', 'baz', 'foo3_baz') 
      }
    , init: function () {}
    }
  , configuration: 
    { inherits: ['test/foo3', 'test/foo4']
    , dependencies: {'test/foo5': 'foo5'}
    }
  }
, 'test/foo3': 
  { definition: 
    { foo3_name: 'foo3'
    , baz: function (val) {
        return val
      }
    }
  , configuration: {}
  }
, 'test/foo4': 
  { definition: 
    { foo4_name: 'foo4'
    , baz: function () {
        return 'foo4_baz'
      }
    }
  , configuration: 
    { requires: ['bar'] }
  }
, 'test/foo5': 
  { definition: 
    { foo5_name: 'foo5'
    , baz: function () {
        return 'foo5_baz'
      }
    , init: function () {}
    }
  , configuration: {}
  }
, 'test/foo6': 
  { definition: 
    { val: ''
    , init: function (val) {        
        this.val = val
      }
    }
  , configuration: {}
  }
, 'test/foo7': 
  { definition: 
    { val: ''
    , init: function (val) {
        this.val = val
      }
    }
  , configuration: 
    { inherits: ['test/foo4'] }
  }
, 'test/cyclic/foo1': 
  { definition: 
    { foo1: 'foo1'
    , init: function () {}
    }
  , configuration: 
    { dependencies: 
      {'test/cyclic/foo2':'_foo2'}
    }
  }
, 'test/cyclic/foo2': 
  { definition: 
    { foo2: 'foo2'
    , init: function () {}
    }
  , configuration: 
    { dependencies: 
      {'test/cyclic/foo1':'_foo1'}
    }
  }
, 'test/inheritDependency/foo1': 
  { definition: 
    { foo1: 'foo1'
    , init: function () {}
    }
  , configuration: 
    { inherits:
      ['test/inheritDependency/foo2']
    , requires: ['_foo3']
    }
  }
, 'test/inheritDependency/foo2': 
  { definition: 
    { foo2: 'foo2'
    , init: function () {}
    }
  , configuration: 
    { dependencies: 
      {'test/inheritDependency/foo3':'_foo3'}
    }
  }
, 'test/inheritDependency/foo3': 
  { definition: 
    { foo3: 'foo3'
    , init: function () {}
    }
  , configuration: {}
  }
, 'test/sharing/foo1': 
  { definition: 
    { foo1: 'foo1'
    , init: function () {}
    }
  , configuration: 
    { dependencies: 
      {'test/sharing/foo3':'_foo3'}
    }
  }
, 'test/sharing/foo2': 
  { definition: 
    { foo2: 'foo2'
    , init: function () {}
    }
  , configuration: 
    { dependencies: 
      {'test/sharing/foo3':'_foo3'}
    }
  }
, 'test/sharing/foo3': 
  { definition: 
    { foo3: 'foo3'
    , init: function () {}
    }
  , configuration: {
      shared: true
    }
  }
}

exports['object creation 2'] = testUtils.testCase(
{
  setUp: function (callback) {
    this.core = testUtils.getFreshModule('org.motionjs.core/lib/core').motionjs
    var self = this
    this.core._requireModule = function (identifier) {
      self.core._modules[identifier] = fakeIdentifiers1[identifier]          
    }
    callback()
  }
, tearDown: function (callback) {
    this.core = null
    callback()
  }
, 'leaf object creation': function (test) {
    var obj = this.core.create('test/foo1')
    test.equal(typeof obj.bar, 'boolean')
    test.equal(obj.baz(), 'baz')
    test.expect(2)
    test.done()
  }
, 'normal object creation': function (test) {
    var obj = this.core.create('test/foo2')
    test.equal(typeof obj.bar, 'boolean')
    test.equal(obj.foo3_name, 'foo3')
    test.equal(obj.foo4_name, 'foo4')
    test.equal(obj.foo5.foo5_name, 'foo5')
    test.expect(4)
    test.done()
  }
, 'inheriting dependencies works': function (test) {
    var self = this
    test.doesNotThrow(function () {
      var obj = self.core.create('test/inheritDependency/foo1')
      test.equal(obj.foo1, 'foo1')
      test.equal(typeof obj._foo3, 'object')
      test.equal(obj._foo3.foo3, 'foo3')
    }, Error)
    test.expect(4)
    test.done()
  }
, 'passing arguments': function (test) {
    var obj = this.core.create('test/foo6', 'foo')
    test.equal(obj.val, 'foo')
    test.expect(1)
    test.done()
  }
, 'object properties are independent': function (test) {
    var foo1a = this.core.create('test/foo1')
    var foo1b = this.core.create('test/foo1')
    test.notStrictEqual(foo1a, foo1b, 'objects should be different')
    test.notStrictEqual(foo1a.foo1_testObject, foo1b.foo1_testObject, 'properties should be different')
    test.expect(2)
    test.done()
  }
, 'isInstanceOf check': function (test) {
    var obj = this.core.create('test/foo5')
    test.equal(obj.isInstanceOf('test/foo5'), true)
    test.equal(obj.isInstanceOf('test/bar'), false)
    test.equal(obj._type, 'test/foo5')
    test.expect(3)
    test.done()
  }
, 'creating an identifier with no init method should fail': function (test) {
    var self = this
    test.throws(function () {
      var obj = self.core.create('test/foo4')
    }, Error, 'If there is no init function, an ability cannot be created')
    test.done()
  }
, 'creation of identifier with unmet requirements should fail': function (test) {
    var self = this
    test.throws(function () {
      var obj = self.core.create('test/foo7')
    }, Error, 'All requirements of an ability must be met')
    test.done()
  }
, 'creation of objects with cyclic development works': function (test) {
    var obj = this.core.create('test/cyclic/foo1')
    test.equal(obj._foo2._foo1.foo1, 'foo1')
    test.expect(1)
    test.done()
  }
, 'sharing of objects works': function (test) {
    var foo1 = this.core.create('test/sharing/foo1')
    var foo2 = this.core.create('test/sharing/foo2')
    test.strictEqual(foo1._foo3, foo2._foo3)
    test.expect(1)
    test.done()
  }
, 'prototype is properly built': function (test) {
    var obj = this.core.create('test/foo1')
    test.equals(typeof obj._uber, 'function')
    test.equals(typeof obj.isInstanceOf, 'function')      
    test.expect(2)
    test.done()
  }
, '_uber function works as expected': function (test) {
    var obj = this.core.create('test/foo2')
    test.equal(obj.baz(), 'foo2 + foo3_baz')
    test.throws(function () {obj.baz2()}, Error, '_uber cannot access outside inherits')
    test.expect(2)
    test.done()
  }
})

var fakeIdentifiers2 =
{ 'test/foo1': 
  { definition: 
    { bar: 1 
    , init: function (val) {
        this.bar = val
      }
    }
  , configuration: 
    {}
  }
, 'test/foo2': 
  { definition: 
    { bar: 'foo2'
    , init: function () {}
    }
  , configuration: 
    {}
  }
, 'test/foo3': 
  { definition: 
    { bar: 'foo3'
    , init: function () {}
    }
  , configuration: 
    { inherits: ['test/foo4']
    , dependencies: {'test/foo6': 'foo6'}
    }
  }
, 'test/foo4': 
  { definition: 
    { baz: 'foo4'
    , init: function () {}
    }
  , configuration: 
    {}
  }
, 'test/foo5': 
  { definition: 
    { baz: 'foo5'
    , init: function () {}
    }
  , configuration: 
    {}
  }
, 'test/foo6': 
  { definition: 
    { bar: 'foo6'
    , init: function () {}
    }
  , configuration: 
    {}
  }
, 'test/foo7': 
  { definition: 
    { bar: 'foo7'
    , init: function () {}
    }
  , configuration: 
    {}
  }
}
var fakeConfiguration2 =
{
  objects:
  {
    'test/foo1':
    { defaultArguments: [2] }
  , 'test/foo2':
    { providedBy: 'test/foo3' }
  , 'test/foo4':
    { providedBy: 'test/foo5' }
  , 'test/foo6':
    { providedBy: 'test/foo7' }
  }
}

exports['global object configuration'] =  testUtils.testCase(
{ setUp: function (callback) {
    this.core = testUtils.getFreshModule('org.motionjs.core/lib/core').motionjs
    var self = this
    this.core._requireModule = function (identifier) {
      self.core._modules[identifier] = fakeIdentifiers2[identifier]          
    }
    this.core._setConfiguration(fakeConfiguration2)
    callback()
  }
, tearDown: function (callback) {
    this.core = null
    callback()
  }
, 'defaultArguments is used': function (test) {
    var obj = this.core.create('test/foo1')
    test.equal(obj.bar, 2)
    test.expect(1)
    test.done()
  }
, 'providedBy is taken into account': function (test) {
    var obj = this.core.create('test/foo2')
    test.equal(obj.bar, 'foo3')
    test.equal(obj.baz, 'foo5')
    test.equal(obj.foo6.bar, 'foo7')
    test.expect(3)
    test.done()
  }
})