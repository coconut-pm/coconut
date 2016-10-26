const IPFS = require('ipfs-api'),
      FeedStore = require('orbit-db-feedstore'),
      utils = require('./utils');

const enc = require('./encryption.js')

const DB_NAME = 'coconut';

class DB {
  constructor(id = mandatory(), password = mandatory()) {
    this.key = enc.expandKey()
    this.ipfs = new IPFS();
    this.store = new FeedStore(this.ipfs, id, DB_NAME);

    this._registerListeners();
  }

  _registerListeners() {
    this.store.events.on('write', (dbname, hash) => {
      this._hash = hash;
    });
  }

  sync(hash = mandatory()) {
    this._hash = hash;
    return this.store.sync(hash);
  }

  add(entry = mandatory()) {
    let encEntry = enc.encryptJson(entry, key)
    return this.store.add(encEntry);
  }

  remove(hash = mandatory()) {
    return this.store.remove(hash);
  }

  update(hash = mandatory(), entry = mandatory()) {
    return remove(hash)
      .then(this.add.bind(this, entry));
  }

  get entries() {
    return this.store.iterator({ limit: -1 })
      .collect()
      .map(e => {
        let encEntry = e.payload.value
        return enc.decryptJson(encEntry.ciphertext, encEntry.nonce, key)
      })
  }

  get hash() {
    return this._hash;
  }
}

module.exports = DB;

// vim: sw=2

