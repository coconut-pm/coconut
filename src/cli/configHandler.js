const fs = require('fs'),
      os = require('os'),
      path = require('path'),
      serverCommunication = require('../core/serverCommunication')

class ConfigHandler {
  constructor() {
    this.defaultFile = path.join(os.homedir(), '.config', 'coconut')
  }

  set file(file) {
    this._file = file
  }

  get file() {
    if (!this._file) {
      this._file = this.defaultFile
      let dirname = path.dirname(this._file)
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname)
      }
    }

    return this._file
  }

  getHash(passwordHash, required) {
    return this.getRemoteHash(passwordHash)
      .catch(() => this.getLocalHash())
      .catch(() => {
        if (required) {
          exit('Coconut is not initialized. \nRun \'coconut add\' to get started.')
        } else {
          return Promise.reject('No hash, but it is okay..')
        }
      })
  }

  getRemoteHash(passwordHash) {
    return this.readConfig()
      .then(({ server }) => server || Promise.reject('No remote hash'))
      .then(server => serverCommunication.get(server, passwordHash))
      .then(hash => this.writeHash(passwordHash, hash, true))
  }

  getLocalHash() {
    return this.readConfig()
      .then(({ hash }) => hash || Promise.reject('No local hash'))
  }

  readConfig() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.file, (error, data) => {
        if (error) {
          let config = {}
          this.writeConfig(config)
          resolve(config)
        } else {
          resolve(JSON.parse(data.toString()))
        }
      })
    })
  }

  writeHash(passwordHash, hash, avoidSync) {
    let config
    this.readConfig()
      .then(_config => config = Object.assign(_config, { hash }))
      .then(() => this.writeConfig(config))
      .then(() => config.server && !avoidSync ? Promise.resolve() : Promise.reject())
      .then(() => serverCommunication.post(config.server, passwordHash, hash))
      .catch(() => {})
      .then(() => hash)
  }

  writeConfig(config) {
    return new Promise((resolve, reject) => {
      config = JSON.stringify(config)
      fs.writeFile(this.file, config, error => {
        if (error) {
          reject(error)
        } else {
          resolve(config)
        }
      })
    })
  }

  addServer(server) {
    this.readConfig()
      .then(config => Object.assign(config, { server }))
      .then(config => this.writeConfig(config))
  }

  removeServer() {
    this.readConfig()
      .then(config => {
        delete config.server
        this.writeConfig(config)
      })
  }

  printServer() {
    return this.readConfig()
      .then(({ server }) => server
          || Promise.reject('You have not connected to a server yet.'))
  }
}

module.exports = new ConfigHandler()

// vim: sw=2

