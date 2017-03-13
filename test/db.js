const expect = require('chai').expect,
      DB = require('../src/core/db')
      ipfsd = require('ipfsd-ctl')

describe('Communication with orbit-db-feedstore', function() {
  this.timeout(5000)
  let db

  before(function(done) {
    ipfsd.disposableApi((err, ipfs) => {
      this.ipfs = ipfs
      db = new DB('testpassword', this.ipfs)
      done()
    })
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
    db._add(value)
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
    db._update('nonexistenthash', {test: 'test'})
      .catch(() => {
        done()
      })
  })

  describe('operating on an existing object', function() {
    beforeEach(function(done) {
      db._add({a: 'b'})
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
      db._update(entry0.hash, newEntry)
        .then(() => {
          expect(db.entries[0].value).to.deep.equal(newEntry)
          done()
        })
    })

    it('should reject when connecting to non-existent hash', function(done) {
      let db2 = new DB('testpassword', this.ipfs)
      db2.connect('nonexistenthash')
        .catch(() => {
          done()
        })
    })

    it('should sync from hash', function(done) {
      let db2 = new DB('testpassword', this.ipfs)
      db2.connect(db.hash)
        .then(() => {
          expect(db2.entries).to.deep.equal(db.entries)
          done()
        })
    })

    it('should throw if sync wrong password', function(done) {
      let db2 = new DB('wrongpassword', this.ipfs)
      db2.connect(db.hash)
        .then(() => {
          expect.fail()
        }).catch((err) => {
          expect(err.message).to.equal('Incorrect password for given database')
          done()
        })
    })
  })
})

// vim: sw=2

