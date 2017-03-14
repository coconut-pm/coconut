if (typeof window === 'undefined') {
  nacl = require('tweetnacl')
  nacl.util = require('tweetnacl-util')
}

class Encryption {
  static encryptJson(json, key) {
    let nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    let msgUint8Array = nacl.util.decodeUTF8(JSON.stringify(json))
    let encryptedMsg = nacl.secretbox(msgUint8Array, nonce, key)
    return {
      nonce: nacl.util.encodeBase64(nonce),
      ciphertext: nacl.util.encodeBase64(encryptedMsg)
    }
  }

  static decryptJson(ciphertext, nonce, key) {
    nonce = nacl.util.decodeBase64(nonce)
    ciphertext = nacl.util.decodeBase64(ciphertext)
    let decryptedMsg = nacl.secretbox.open(ciphertext, nonce, key)
    return JSON.parse(nacl.util.encodeUTF8(decryptedMsg))
  }

  static expandKey(keyString) {
    return nacl.hash(nacl.util.decodeUTF8(keyString)).slice(32)
  }
}

if (typeof window === 'undefined') {
  module.exports = Encryption
} else {
  window.Encryption = Encryption
}

// vim: sw=2

