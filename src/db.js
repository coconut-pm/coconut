const IPFS = require('ipfs'),
      Log = require('ipfs-log');

const LOG_NAME = 'avocado';

class DB {
  constructor() {
    this.ipfs = new IPFS();
  }

  connect(id, hash) {
    return new Promise((resolve, reject) => {
      if (hash) {
        Log.fromIpfsHash(this.ipfs, hash)
          .then(log => {
            this.log = log;
            resolve();
          });
      } else {
        this.log = new Log(this.ipfs, id, LOG_NAME);
        resolve();
      }
    });
  }

  getHash() {
    return Log.getIpfsHash(this.ipfs, this.log);
  }
}

module.exports = DB;

// vim: sw=2

