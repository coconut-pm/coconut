const IPFS = require('ipfs-api'),
      Log = require('ipfs-log'),
      Entry = require('../node_modules/ipfs-log/src/entry'),
      utils = require('./utils');

const LOG_NAME = 'avocado';

class DB {
  constructor() {
    this.ipfs = new IPFS();
  }

  connect(id = mandatory(), hash) {
    return new Promise((resolve, reject) => {
      if (hash) {
        this._fromHash(id, hash).then(resolve);
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
      this.log.add(entry).then(() => resolve(id));
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

  _appendItemToEntry(entry, { payload }) {
    if (payload.removed) {
      entry.removed = true;
    } else if (!payload.field) {
      entry.id = payload.id;
    } else if (payload.value) {
      if (payload.value.removed) {
        delete entry[payload.field];
      } else {
        // TODO: Replace value with decryption of item.cipher.
        entry[payload.field] = payload.value.value;
      }
    }
  }

  updateField(id = mandatory(), field = mandatory(), value = mandatory()) {
    // TODO: Replace value with encrypted version.
    let update = { id, field, value: { value } };
    return this.log.add(update);
  }

  removeField(id = mandatory(), field = mandatory()) {
    let update = { id, field , value: { removed: true } };
    return this.log.add(update);
  }

  removeEntry(id = mandatory()) {
    let update = { id, removed: true };
    return this.log.add(update);
  }

  getHash() {
    return this.log.items[this.log.items.length - 1].hash;
  }

  _fromHash(id, hash) {
    return new Promise((resolve, reject) => {
      this._retreiveEntries(hash)
        .then(entries => {
          this.log = new Log(this.ipfs, id, LOG_NAME, { items: entries.reverse() });
          resolve();
        });
    });
  }

  _retreiveEntries(hash, entries = []) {
    return new Promise((resolve, reject) => {
      Entry.fromIpfsHash(this.ipfs, hash)
        .then(entry => {
          entries.push(entry);
          if (entry.next.length) {
            this._retreiveEntries(entry.next, entries).then(resolve);
          } else {
            resolve(entries);
          }
        });
    });
  }
}

module.exports = DB;

// vim: sw=2

