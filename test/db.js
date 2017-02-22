const expect = require('chai').expect,
      DB = require('../src/db')

describe('Communication with orbit-db-feedstore', function() {
  let db

  before(function() {
    db = new DB('testpassword')
  })

  afterEach(function(done) {
    let entries = db.entries
    Promise.all(entries.map(({hash, value}) => db.remove(hash)))
      .then(() => {
        done()
      })
  })

  it('should start with an empty list of objects', function() {
    let entries = db.entries
    expect(entries).to.be.instanceof(Array)
    expect(entries).to.be.empty
  })

  it('should add an object', function(done) {
    let value = {a: 'b'}
    db.add(value)
      .then(() => {
        let entries = db.entries
        expect(entries).to.have.lengthOf(1)
        expect(entries[0]).to.have.property('hash')
        expect(entries[0]).to.have.property('value')
        expect(entries[0].value).to.deep.equal(value)
        done()
      })
  })

  it('should return undefined if hash doesn\'t exists', function() {
    expect(db.get('nonexistenthash')).to.be.undefined
  })

  it('should reject when trying to delete non-existent hash', function(done) {
    db.remove('nonexistenthash')
      .catch(() => {
        done()
      })
  })

  it('should reject when trying to update non-existent hash', function(done) {
    db.update('nonexistenthash', {test: 'test'})
      .catch(() => {
        done()
      })
  })

  it('should reject when syncing from non-existent hash', function(done) {
    db.sync('nonexistenthash')
      .catch(() => {
        done()
      })
  })

  describe('operating on an existing object', function() {
    beforeEach(function(done) {
      db.add({a: 'b'})
        .then(() => {
          done()
        })
    })

    it('should get object by hash', function() {
      let entry0 = db.entries[0]
      let entry = db.get(entry0.hash)
      expect(entry).to.deep.equal(entry0)
    })

    it('should remove an object', function(done) {
      let entry0 = db.entries[0]
      db.remove(entry0.hash)
        .then(() => {
          expect(db.entries).to.be.empty
          done()
        })
    })

    it('should update an object', function(done) {
      let newEntry = {a: 5, b: 'c'}
      let entry0 = db.entries[0]
      db.update(entry0.hash, newEntry)
        .then(() => {
          expect(db.entries[0].value).to.deep.equal(newEntry)
          done()
        })
    })

    it('should sync from hash', function(done) {
      let db2 = new DB('testpassword')
      db2.sync(db.hash)
        .then(() => {
          expect(db2.entries).to.deep.equal(db.entries)
          done()
        })
    })
  })
})

// vim: sw=2

