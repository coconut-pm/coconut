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
        db.updateField(id, 'testField', 'testValue')
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
        db.updateField(id, field, 'testValue1')
          .then(db.updateField.bind(db, id, field, 'testValue2'))
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
    expect(db.updateField).to.throw(Error);
    expect(db.updateField).to.throw(Error);
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

  it('should remove an entry', function(done) {
    db.newEntry()
      .then(id => {
        db.updateField(id, 'testField', 'testValue')
          .then(db.removeEntry.bind(db, id))
          .then(() => {
            expect(db.entries).to.be.empty;
            done();
          })
      });
  });

  it('should remove a value', function(done) {
    db.newEntry()
      .then(id => {
        db.updateField(id, 'testField1', 'testValue1')
          .then(db.updateField.bind(db, id, 'testField2', 'testValue2'))
          .then(db.removeField.bind(db, id, 'testField2'))
          .then(() => {
            expect(db.getEntry(id).testField1).to.not.be.undefined;
            expect(db.getEntry(id).testField2).to.be.undefined;
            done();
          })
      });
  });
});

// vim: sw=2

