const IPFS = require('ipfs-api'),
      FeedStore = require('orbit-db-feedstore'),
      utils = require('./utils');

const DB_NAME = 'coconut';

class DB {
  constructor(id = mandatory()) {
    this.ipfs = new IPFS();
    this.store = new FeedStore(this.ipfs, id, DB_NAME);

    this._registerListeners();
  }

  _registerListeners() {
    this.store.events.on('write', console.log.bind(console));
  }

  sync(hash = mandatory()) {
    this._hash = hash;
    return this.store.sync(hash);
  }

  add(entry = mandatory()) {
    return this.store.add(entry);
  }

  remove(hash = mandatory()) {
    return new Promise((resolve, reject) => {
      this.store.remove(hash, hash => {
        this._hash = hash;
        resolve();
      });
    });
  }

  update(hash = mandatory(), entry = mandatory()) {
    return remove(hash)
      .then(() => this.add(entry))
  }

  get entries() {
    return this.store.iterator({ limit: -1 })
      .collect();
  }

  get(hash = mandatory()) {
    return this.store.get(hash);
  }

  get hash() {
    return this._hash;
  }
}

let db = new DB('oskar');
db.sync('QmRtLnSzSXBWcegA6LTj5fVKpvNvwsVmRB4RoEEZkc4Qz5')
  .then(() => {
    //db.add("oed");
    console.log(db.entries);
  })

module.exports = DB;

// vim: sw=2

