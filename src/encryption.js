const nacl      = require('tweetnacl')
const naclUtil  = require('tweetnacl-util')

class Encryption {
  static encryptJson(json, key) {
    let nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    let msgUint8Array = naclUtil.decodeUTF8(JSON.stringify(json))
    let encryptedMsg = nacl.secretbox(msgUint8Array, nonce, key)
    return {
      nonce: naclUtil.encodeBase64(nonce),
      ciphertext: naclUtil.encodeBase64(encryptedMsg)
    }
  }

  static decryptJson(ciphertext, nonce, key) {
    nonce = naclUtil.decodeBase64(nonce)
    ciphertext = naclUtil.decodeBase64(ciphertext)
    let decryptedMsg = nacl.secretbox.open(ciphertext, nonce, key)
    return JSON.parse(naclUtil.encodeUTF8(decryptedMsg))
  }

  static expandKey(keyString) {
    return nacl.hash(naclUtil.decodeUTF8(keyString)).slice(32)
  }
}

module.exports = Encryption

