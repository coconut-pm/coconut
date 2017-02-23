const IPFS = require('ipfs'),
      FeedStore = require('orbit-db-feedstore'),
      utils = require('./utils'),
      Encryption = require('./encryption.js')

const DB_NAME = 'coconut'

class DB {
  constructor(password = mandatory(), ipfs = new IPFS({})) {
    this.key = Encryption.expandKey(password)
    this.store = new FeedStore(ipfs, DB_NAME, DB_NAME)
    this._registerListeners()
  }

  _registerListeners() {
    this.store.events.on('write', (dbname, hash) => {
      this._hash = hash
    })
  }

  connect(hash = mandatory()) {
    if (this._hash) {
      throw Error('You can not connect when db has been initialized.')
    }
    this._hash = hash
    return this.store.sync(hash)
      .then(() => {
        return this.entries
      })
  }

  _add(entry = mandatory()) {
    let encEntry = Encryption.encryptJson(entry, this.key)
    return this.store.add(encEntry)
  }

  remove(hash = mandatory()) {
    return new Promise((resolve, reject) => {
      if (this.get(hash)) {
        this.store.remove(hash)
          .then(resolve)
      } else {
        reject()
      }
    })
  }

  _update(hash = mandatory(), entry = mandatory()) {
    return this.remove(hash)
      .then(this._add.bind(this, entry))
  }

  get(hash = mandatory()) {
    let e = this.store.get(hash)
    return e === undefined ? undefined : {
      hash: e.hash,
      value: this._decrypt(e)
    }
  }

  get entries() {
    return this.store.iterator({ limit: -1 })
      .collect()
      .map(e => ({
          hash: e.hash,
          value: this._decrypt(e)
        })
      )
  }

  _decrypt(e) {
    let encEntry = e.payload.value
    let entry
    try {
      entry = Encryption.decryptJson(encEntry.ciphertext, encEntry.nonce, this.key)
    } catch (err) {
      throw Error('Incorrect password for given database')
    }
    return entry
  }

  get hash() {
    return this._hash
  }
}

module.exports = DB

// vim: sw=2

