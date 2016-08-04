const nacl = require('tweetnacl');



class Encryption {
  static encryptString(msg, key) {
    let nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
    let msgUint8Array = nacl.util.decodeUTF8(msg);
    let encryptedMsg = nacl.secretbox(msgUint8Array, res.nonce, key);
    return {
      nonce: nacl.util.encodeBase64(nonce),
      ciphertext: nacl.util.encodeBase64(encryptedMsg)
    };
  }

  static decryptString(ciphertext, nonce, key) {
    nonce = nacl.util.decodeBase64(nonce);
    ciphertext = nacl.util.decodeBase64(ciphertext);
    return nacl.secretbox.open(ciphertext, nonce, key);
  }
}
