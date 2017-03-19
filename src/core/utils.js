
mandatory = function() {
    throw new Error('Missing parameter')
}

if (typeof window === 'undefined') {
    module.exports = { generatePassword }
} else {
    utils = { generatePassword }
}

// vim: sw=2

