const IPFS = require('ipfs'),
      Log = require('ipfs-log'),
      utils = require('./utils');

const LOG_NAME = 'avocado';

class DB {
  constructor() {
    this.ipfs = new IPFS();
  }

  connect(id = mandatory(), hash) {
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
    return new Promise((resolve, reject) => {
      let id = this._getNewId();
      let entry = { id };
      this.log.add(entry)
        .then(() => {
          resolve(id);
        });
    });
  }

  _getNewId() {
    let ids = this.log.items.map(item => item.payload.id);
    let id = ids.length > 0 ? Math.max(...ids) + 1 : 0;
    return id;
  }

  get entries() {
    let entries = [];
    this.log.items.forEach(item => {
      let id = item.payload.id;
      entries[id] = entries[id] || {};
      this._appendItemToEntry(entries[id], item);
    });

    entries = entries.filter(entry => !entry.removed);
    return entries;
  }

  getEntry(id = mandatory()) {
    let entry = {};
    this.log.items.filter(item => item.payload.id === id)
      .forEach(this._appendItemToEntry.bind(this, entry));

    if (Object.keys(entry).length === 0 || entry.removed) {
      throw new Error('Entry with id "' + id + '" does not exist')
    }
    return entry;
  }

  _appendItemToEntry(entry, item) {
    if (item.payload.removed) {
      entry.removed = true;
    } else if (!item.payload.field) {
      entry.id = item.payload.id;
    } else if (item.payload.value) {
      // TODO: Replace value with decryption of item.cipher.
      entry[item.payload.field] = item.payload.value.value;
    }
  }

  updateEntry(id = mandatory(), field = mandatory(), value = mandatory()) {
    // TODO: Replace value with encrypted version.
    let update = { id, field, value: { value } };
    return this.log.add(update);
  }

  removeEntry(id) {
    let update = { id, removed: true };
    return this.log.add(update);
  }

  getHash() {
    return Log.getIpfsHash(this.ipfs, this.log);
  }
}

module.exports = DB;

// vim: sw=2

