const IPFS = require('ipfs'),
      Log = require('ipfs-log');

const LOG_NAME = 'avocado';

class DB {
  constructor(id, hash) {
    this.ipfs = new IPFS();

    this._createLog(id, hash);
  }

  _createLog(id, hash) {
    if (hash) {
      Log.fromIpfsHash(this.ipfs, hash)
        .then(log => {
          this.log = log;
        });
    } else {
      this.log = new Log(this.ipfs, id, LOG_NAME);
    }
  }

  getHash() {
    return Log.getIpfsHash(this.ipfs, this.log);
  }
}

// vim: sw=2

