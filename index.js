/*
 * nconf-leveldb.js: nconf configuration leveldb backend
 *
 * (C) 2015, Abraham Elmahrek.
 *
 */

var nconf = require('nconf');
var level = require('level');
var deasync = require('deasync');

var Level = function(options) {
  options       = options || {};
  this.type     = 'level';
  this.store    = {};
  this.readOnly = false;
  this.path = options.path || null;
  this.logicalSeparator = options.logicalSeparator || ':';

  this.store = level(this.path);
};

Level.prototype.get = function(key) {
  var path   = nconf.path(key, this.logicalSeparator),
      result = null,
      err    = null;
  this.store.get(path, function(_err, _value) {
    if (err) err = _err;
    else result = _value;
  });
  deasync.loopWhile(function() {
    return result === null && err === null;
  });
  if (err) {
    throw err;
  }
  if (result) return JSON.parse(decodeURIComponent(result));
};

Level.prototype._put = function(key, value) {
  var path = (key.length === 0) ? [] : nconf.path(key, this.logicalSeparator),
      batch = this.store.batch(),
      done = false,
      err = null;
  // Reset should be object.
  if (path.length === 0 && (!value || typeof value !== 'object')) {
    return false;
  }

  var helper = function(path, value) {
    // Objects need merging only.
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        path.push(key);
        helper(path, value[key]);
        path.pop();
      }
    } else {
      batch.put(nconf.key(path), encodeURIComponent(JSON.stringify(value)));
    }
  };

  helper(path, value);

  batch.write(function(_err) {
    err = _err;
    done = true;
  });
  deasync.loopWhile(function() {
    return !done;
  });
  if (err) {
    throw err;
  }
  return true;
};

Level.prototype.set = function(key, value) {
  if (this.readOnly) {
    return false;
  }

  // Overwrite key and write data.
  return this.clear(key) && this._put(key, value);
};

Level.prototype.clear = function(key) {
  if (this.readOnly) {
    return false;
  }

  var path = (key.length === 0) ? [] : nconf.path(key, this.logicalSeparator),
      newkey = nconf.key(path),
      batch = this.store.batch(),
      done = false,
      err = null,
      errFn = function(_err) {
        err = _err;
        done = true;
      };
  
  this.store.createReadStream()
  .on('data', function(data) {
    if (newkey.length === 0 || newkey.startsWith(data.key)) {
      batch.del(data.key);
    }
  })
  .on('error', errFn)
  .on('end', function() {
    batch.write(errFn);
  });
  deasync.loopWhile(function() {
    return !done;
  });
  if (err) {
    throw err;
  }
  return true;
};

Level.prototype.merge = function(key, value) {
  if (this.readOnly) {
    return false;
  }

  // Objects need merging only.
  if (typeof value !== 'object' || Array.isArray(value) || value === null) {
    return this.set(key, value);
  }

  return this._put(key, value);
};

Level.prototype.reset = function() {
  if (this.readOnly) {
    return false;
  }

  var self = this,
      done = false,
      err = null,
      errFn = function(cb) {
        return function(_err) {
          if (_err) {
            err = _err;
            done = true;
          } else {
            return cb(Array.prototype.slice.call(arguments, 1));
          }
        };
      };
  this.store.close(errFn(function(_err) {
    level.destroy(self.path, errFn(function() {
      self.store = level(self.path);
      done = true;
    }));
  }));
  deasync.loopWhile(function() {
    return !done;
  });
  if (err) {
    throw err;
  }
  return true;
};

Level.prototype.loadSync = function() {
  var result = {},
      done = false,
      err = null;
  this.store.createReadStream()
  .on('data', function(data) {
    var path = nconf.path(key, this.logicalSeparator),
        lastKey = path.pop(),
        target = result;
    while (path.length > 0) {
      var key = path.shift();
      if (!(key in target)) target[key] = {};
      target = target[key];
    }
    target[lastKey] = data.value;
  })
  .on('error', function(_err) {
    err = _err;
    done = true;
  })
  .on('end', function() {
    done = true;
  });
  deasync.loopWhile(function() {
    return !done;
  });
  if (err) {
    throw err;
  }
  return result;
};

module.exports = function(provider) {
  provider.Level = Level;
};
