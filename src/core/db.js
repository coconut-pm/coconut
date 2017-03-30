if (typeof window === 'undefined') {
  IpfsApi = require('ipfs-api')
  CryptoJS = require('crypto-js')
  OrbitDB = require('orbit-db')
  utils = require('./utils')
  Encryption = require('./encryption.js')
}

class DB {
  constructor(password = mandatory(), ipfs = new IpfsApi()) {
    this.ipfs = ipfs
    this.key = Encryption.expandKey(password)
    this.passwordHash = CryptoJS.SHA3(password).toString()

    let orbitdb = new OrbitDB(ipfs)
    this.store = orbitdb.feed(this.passwordHash)
    this.store.events.on('write', (dbname, hash) => {
      this._hash = hash
    })
  }

  connectedToIpfs() {
    return this.ipfs.config.get()
      .then(() => Promise.resolve())
      .catch(() => Promise.reject('Not connected to IPFS.'))
  }

  connect(hash = mandatory()) {
    if (this._hash) {
      throw 'You can not connect when db has been initialized.'
    }
    this._hash = hash

    return new Promise((resolve, reject) => {
      this.store.events.on('history', () => {
        try {
          resolve(this.entries)
        } catch (e) {
          reject(e)
        }
      })
      this.store.sync(hash)
      setTimeout(() => resolve(), 5000)
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

if (typeof window === 'undefined') {
  module.exports = DB
} else {
  window.DB = DB
}

// vim: sw=2

