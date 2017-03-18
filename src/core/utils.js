
mandatory = function() {
    throw new Error('Missing parameter')
}

function generatePassword(options) {
  options = typeof options === 'object' ? options : {
      length: options
  }
  let password = passwordGenerator(options)
  return password
}

function passwordGenerator(options = {}) {
    let uppercase = options.uppercase === false ? '' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let lowercase = options.lowercase === false ? '' : 'abcdefghijklmnopqrstuvwxyz'
    let digits = options.digits === false ? '' : '0123456789'
    let symbols = options.symbols === false ? '' : '§!@#£¤$%€&¥/{}()[]=+?<>|-_*^~¨¶½,;.:'
    let other = options.other === false ? '' : 'ł®þ←¡«»©“”¸·'
    let length = options.length || 50

    let characters = (uppercase + lowercase + digits + symbols + other).split('')
    let password = ''
    for (let i=0; i<length; i++) {
        let random = Math.floor(Math.random() * characters.length)
        password += characters[random]
    }

    return password
}

if (typeof window === 'undefined') {
    module.exports = { generatePassword }
} else {
    utils = { generatePassword }
}

// vim: sw=2

