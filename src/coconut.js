const DB = require('./db.js')

class Coconut {
  constructor(password = mandatory()) {
    this.db = new DB('usr', password)
  }

  addEntry(service, username, password, url, notes) {
    var entry = {
      service: service,
      username: username,
      password: password,
      url: url,
      notes: notes
    }
    this.db.add(entry).then(console.log.bind(console))
  }
}

module.exports = Coconut

// vim: sw=2
