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

  newEntry() {
    let id = this._getNewId();
    let entry = { id };
    this.log.add(entry);
    return id;
  }

  _getNewId() {
    let ids = this.log.items.map(item => item.id);
    let max = ids.length > 0 ? Math.max(...ids) : 0;
    return max + 1;
  }

  getEntry(id) {
    let entry = {};
    this.log.items.filter(item => item.payload.id === id)
      .forEach(item => {
        if (!item.payload.field) {
          entry.id = id;
        } else {
          // TODO: Replace value with decryption of item.cipher.
          entry[item.payload.field] = item.payload.value;
        }
      });

    if (Object.keys(entry).length === 0) {
      throw new Error('Entry with id "' + id + '" does not exist')
    }
    return entry;
  }

  updateEntry(id, field, value) {
    // TODO: Replace value with encrypted version.
    let update = { id, field, value };
    return this.log.add(update);
  }

  getHash() {
    return Log.getIpfsHash(this.ipfs, this.log);
  }
}

module.exports = DB;

// vim: sw=2

