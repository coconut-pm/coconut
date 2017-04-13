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

    this._initStore()
  }

  _initStore() {
    let orbitdb = new OrbitDB(this.ipfs)
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
      let clear = clearTimeout.bind(global, setTimeout(resolve, 5000))
      this.store.events.on('history', () => clear() & resolve(this.entries))
      this.store.sync(hash)
        .catch((...a) => clear() & reject(...a))
    })
  }

  _add(entry = mandatory()) {
    let encEntry = Encryption.encryptJson(entry, this.key)
    return this.store.add(encEntry)
  }

  remove(hash = mandatory()) {
    if (this.get(hash)) {
      return this.store.remove(hash)
    } else {
      return Promise.reject()
    }
  }

  _update(hash = mandatory(), entry = mandatory()) {
    return this.remove(hash)
      .then(this._add.bind(this, entry))
  }

  _get(entry) {
    return !entry ? undefined : {
      hash: entry.hash,
      value: this._decrypt(entry)
    }
  }

  get(hash = mandatory()) {
    let entry = this.store.get(hash)
    return this._get(entry)
  }

  get entries() {
    return this.store.iterator({ limit: -1 })
      .collect()
      .map(this._get.bind(this))
  }

  _decrypt(e) {
    let encEntry = e.payload.value
    let entry
    try {
      entry = Encryption.decryptJson(encEntry.ciphertext, encEntry.nonce, this.key)
    } catch (error) {
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

