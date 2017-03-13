const expect    = require('chai').expect
const enc       = require('../src/core/encryption')

describe('Encryption functions', () => {
  let key

  it('should expand a key correctly', (done) => {
    let password = 'mysecurepassword'
    key = enc.expandKey(password)
    expect(key.length).to.equal(32)
    done()
  })

  it('should encrypt and decrypt correctly', (done) => {
    let jsonData = {
      wow: 'much data',
      very: 'wow'
    }
    let encrypted = enc.encryptJson(jsonData, key)
    let decrypted = enc.decryptJson(encrypted.ciphertext, encrypted.nonce, key)
    expect(decrypted.very).to.equal(jsonData.very)
    expect(decrypted.wow).to.equal(jsonData.wow)
    done()
  })
})
