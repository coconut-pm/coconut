const expect = require('chai').expect,
      DB = require('../src/db')

describe('Communication with IPFS', function() {
  let db

  before(function() {
    db = new DB('testuser', 'testpassword')
  })

  after(function() {
    let entries = db.entries
    entries.forEach(({hash, value}) => {
      db.remove(hash)
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

  it('should get object by hash', function() {
    let entry0 = db.entries[0]
    let hash = entry0.hash
    let entry = db.get(hash)
    expect(entry).to.deep.equal(entry0)
  })
})

// vim: sw=2

