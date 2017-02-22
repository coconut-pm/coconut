const DB = require('./db.js')

class Coconut extends DB {
  addEntry(service, username, password, url, notes) {
    if (this.search(service).length) {
      throw Error('The given service already exist, use updateEntry instead.')
    }
    var entry = {
      service: service,
      username: username,
      password: password,
      url: url,
      notes: notes
    }
    return this._add(entry)
  }

  updateEntry(hash = mandatory(), service, username, password, url, notes) {
    var entry = this.get(hash)
    entry.service = service || entry.service
    entry.username = username || entry.username
    entry.password = password || entry.password
    entry.url = url || entry.url
    entry.notes = notes || entry.notes

    return this._update(hash, entry)
  }

  search(query) {
    return this.entries.filter(this._searchFilter(query))
  }

  _searchFilter(query) {
    return entry => entry.value.service.indexOf(query) != -1
  }

}

module.exports = Coconut

// vim: sw=2
