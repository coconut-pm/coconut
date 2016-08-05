const expect = require('chai').expect,
      DB = require('../src/db');

describe('Communication with IPFS', function() {
  it('should find previous entries when starting with a hash', function(done) {
    let db1 = new DB();
    let db2 = new DB();
    db1.connect('test')
      .then(() => db1.log.add('testString'))
      .then(db1.getHash.bind(db1))
      .then(db2.connect.bind(db2, 'test'))
      .then(() => {
        let item1 = db1.log.items[0].payload;
        let item2 = db2.log.items[0].payload;
        expect(item1).to.equal(item2);
        done();
      });
  });
});

// vim: sw=2

