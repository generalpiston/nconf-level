# nconf-level
A LevelDB store for [nconf][0]

## Installation

### Installing npm (node package manager)
``` bash
  $ curl http://npmjs.org/install.sh | sh
```

### Installing nconf-level
``` bash
  $ [sudo] npm install https://github.com/abec/nconf-level
```

## Usage
The store provided by `nconf-level` will persist all of your configuration settings to a LevelDB directory.

``` js
  var nconf = require('nconf');
  require('nconf-level')(nconf);
  
  nconf.use('level', { path: '/tmp/test.leveldb' });

  nconf.set('foo', 'bar');
  nconf.get('foo');    // returns 'bar'
```

[0]: https://github.com/indexzero/nconf
