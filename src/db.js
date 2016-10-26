const IPFS = require('ipfs-api'),
      FeedStore = require('orbit-db-feedstore'),
      utils = require('./utils');

class DB {
  constructor() {
    this.ipfs = new IPFS();
  }

  connect(id = mandatory(), hash) {
  }

  newEntry() {
  }

  get entries() {
  }

  getEntry(id = mandatory()) {
  }

  updateField(id = mandatory(), field = mandatory(), value = mandatory()) {
  }

  removeField(id = mandatory(), field = mandatory()) {
  }

  removeEntry(id = mandatory()) {
  }

  getHash() {
  }
}

module.exports = DB;

// vim: sw=2

