const IPFS = require('ipfs-api'),
      FeedStore = require('orbit-db-feedstore'),
      utils = require('./utils'),
      Encryption = require('./encryption.js')

const DB_NAME = 'coconut'

class DB {
  constructor(id = mandatory(), password = mandatory()) {
    this.key = Encryption.expandKey(password)
    let ipfs = new IPFS()
    this.store = new FeedStore(ipfs, id, DB_NAME)

    this._registerListeners()
  }

  _registerListeners() {
    this.store.events.on('write', (dbname, hash) => {
      this._hash = hash
    })
  }

  sync(hash = mandatory()) {
    this._hash = hash
    return this.store.sync(hash)
  }

  add(entry = mandatory()) {
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

  update(hash = mandatory(), entry = mandatory()) {
    return this.remove(hash)
      .then(this.add.bind(this, entry))
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
    return Encryption.decryptJson(encEntry.ciphertext, encEntry.nonce, this.key)
  }

  get hash() {
    return this._hash
  }
}

module.exports = DB

// vim: sw=2

