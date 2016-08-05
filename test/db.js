const expect = require('chai').expect,
      DB = require('../src/db');

describe('Communication with IPFS', function() {
  let db;

  beforeEach(function(done) {
    db = new DB();
    db.connect('test').then(done);
  });

  it('should find previous entries when starting with a hash', function(done) {
    let db2 = new DB();
    db.log.add('testString')
      .then(db.getHash.bind(db))
      .then(db2.connect.bind(db2, 'test'))
      .then(() => {
        let item1 = db.log.items[0].payload;
        let item2 = db2.log.items[0].payload;
        expect(item1).to.equal(item2);
        done();
      });
  });

  it('should add an item to an entry', function(done) {
    db.newEntry()
      .then(id => {
        db.updateEntry(id, 'testField', 'testValue')
          .then(() => {
            let entry = db.getEntry(id);
            expect(entry['testField']).to.equal('testValue');
            done();
          });
      });
  });

  it('should update an item in an entry', function(done) {
    db.newEntry()
      .then(id => {
        let field = 'testField';
        db.updateEntry(id, field, 'testValue1')
          .then(db.updateEntry.bind(db, id, field, 'testValue2'))
          .then(() => {
            let entry = db.getEntry(id);
            expect(entry['testField']).to.equal('testValue2');
            done();
          });
      });
  });

  it('should throw if trying to access non-existent id', function() {
    expect(db.getEntry.bind(db, 1)).to.throw(Error);
  });

  it('should throw if calling with missing parameters', function() {
    expect(db.getEntry).to.throw(Error);
    expect(db.updateEntry).to.throw(Error);
    expect(db.updateEntry).to.throw(Error);
  });

  it('should add and return the correct number of entries', function(done) {
    db.newEntry()
      .then(db.newEntry.bind(db))
      .then(db.newEntry.bind(db))
      .then(db.newEntry.bind(db))
      .then(() => {
        expect(db.entries).to.have.length(4);
        done();
      });
  });
});

// vim: sw=2

