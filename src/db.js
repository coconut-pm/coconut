const IPFS = require('ipfs'),
      Log = require('ipfs-log');

const LOG_NAME = 'avocado';

class DB {
  constructor(id, hash) {
    this.ipfs = new IPFS();

    if (hash) {
      this.log = Log.fromIpfsHash(ipfs, hash)
        .then(log => {
          this.log = log;
        });
    } else {
      this.log = new Log(ipfs, id, LOG_NAME);
    }
  }
}

new DB('rascal');

// vim: sw=2

