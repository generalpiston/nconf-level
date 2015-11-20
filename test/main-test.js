var assert = require("assert"),
    fs = require("fs");

describe("#full()", function () {
  var nconf = require("nconf");

  before(function() {
    require("../index.js")(nconf);
    nconf.use("level", {
      path: "./testdb"
    });
    nconf.reset();
  });

  after(function() {
    nconf.reset();
  });

  it("literals", function () {
    nconf.set("number", 1);
    nconf.set("string", "test");
    nconf.set("float", 1.2);
    nconf.set("boolean-true", true);
    nconf.set("boolean-false", false);
    nconf.set("array", [1, 2, 3]);
    assert.equal(nconf.get("number"), 1);
    assert.equal(nconf.get("string"), "test");
    assert.equal(nconf.get("float"), 1.2);
    assert.equal(nconf.get("boolean-true"), true);
    assert.equal(nconf.get("boolean-false"), false);
    assert.deepEqual(nconf.get("array"), [1, 2, 3]);

    // Nested
    nconf.set("n:number", 1);
    nconf.set("n:string", "test");
    nconf.set("n:float", 1.2);
    nconf.set("n:boolean-true", true);
    nconf.set("n:boolean-false", false);
    assert.equal(nconf.get("n:number"), 1);
    assert.equal(nconf.get("n:string"), "test");
    assert.equal(nconf.get("n:float"), 1.2);
    assert.equal(nconf.get("n:boolean-true"), true);
    assert.equal(nconf.get("n:boolean-false"), false);
  });

  it("objects", function () {
    nconf.set("1:2:3:4", {"5": {"6": 1}});
    assert.equal(nconf.get("1:2:3:4:5:6"), 1);

    // Test root.
    nconf.set("", {"5": {"6": 1}});
    assert.equal(nconf.get("5:6"), 1);
    assert.equal(nconf.get("1:2:3:4:5:6"), null);
  });

  it("nulls", function () {
    nconf.set("null", null);
    assert.strictEqual(nconf.get("null"), null);
    assert.strictEqual(nconf.get("dne"), undefined);
  });
});
