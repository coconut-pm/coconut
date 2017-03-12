#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      path = require('path'),
      program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy'),
      request = require('request'),
      PasswordGenerator = require('strict-password-generator').default,
      multihash = require('multihashes'),
      packageJson = require('../package.json'),
      Coconut = require('../src/core/coconut'),
      prompts = require('../src/cli/prompts.json')

const CONFIG_FILE = path.join(os.homedir(), '.coconut')
const passwordGenerator = new PasswordGenerator()

prompt.message = ''
const PASSWORD_OPTIONS = { exactLength: 50 }

let passwordHash;

function openDB(callback) {
  safeReadConfig(config => {
    promptHandler(prompts.masterPassword, (error, { masterPassword }) => {
      let passwordBuffer = new Buffer(masterPassword, 'hex')
      passwordHash = multihash.encode(passwordBuffer, 'sha3-256')
      syncHash(config, () => {
        let coconut = new Coconut(masterPassword)
        coconut.connect(config.hash)
          .then(() => {
            callback(coconut)
          }).catch((err) => console.error(err.message))
      })
    })
  })
}

function openOrCreateDB(callback) {
  readConfig((err, config) => {
    promptHandler(prompts.masterPassword, (error, { masterPassword }) => {
      let passwordBuffer = new Buffer(masterPassword, 'hex')
      passwordHash = multihash.encode(passwordBuffer, 'sha3-256')
      if(err) {
        let coconut = new Coconut(masterPassword)
        callback(coconut)
      } else {
        syncHash(config, () => {
          let coconut = new Coconut(masterPassword)
          coconut.connect(config.hash)
            .then(() => {
              callback(coconut)
            }).catch((err) => console.error(err.message))
        })
      }
    })
  })
}

function syncHash({ server }, callback) {
  if (server) {
    let url = server + '?password=' + passwordHash
    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200 && body !== 'undefined') {
        config.hash = body
        writeHash(body, () => {
          callback()
        }, true)
      } else {
        callback()
      }
    })
  } else {
    callback()
  }
}

function readConfig(callback) {
  fs.readFile(CONFIG_FILE, (error, data) => {
    if (error) {
      callback(error)
    } else {
      let config = JSON.parse(data.toString())
      callback(null, config)
    }
  })
}

function safeReadConfig(callback) {
  readConfig((err, config) => {
    if (err) {
      console.log('Coconut is not initialized. \nRun \'coconut add\' to get started.')
      process.exit()
    }
    callback(config)
  })
}


function writeHash(hash, callback, avoidSync) {
  readConfig((err, config) => {
    if (err) {
      config = {}
    }
    config.hash = hash
    writeConfig(config, callback)
    if (config.server && !avoidSync) {
      request.post(config.server).form({ hash, password: passwordHash })
    }
  })
}

function addServer(address) {
  safeReadConfig(config => {
    config.server = address
    writeConfig(config)
  })
}

function removeServer() {
  safeReadConfig(config => {
    delete config.server
    writeConfig(config)
  })
}

function printServer() {
  safeReadConfig(config => {
    console.log(config.server || 'You have not connected to a server yet.')
  })
}

function writeConfig(config, callback) {
  callback = callback || (error => error && console.error(error))
  config = JSON.stringify(config)
  fs.writeFile(CONFIG_FILE, config, callback)
}

function promptHandler(questions, callback) {
  prompt.get(questions, (error, result) => {
    if (error) {
      if (error.message === 'canceled') {
        process.exit()
      } else {
        console.error(error.message)
      }
    } else {
      callback(error, result)
    }
  })
}

function printEntries(entries, withIndex, deep) {
  if (!Array.isArray(entries)) {
    entries = [entries]
  }
  entries.forEach((entry, index) => {
    console.log((withIndex ? index + ': ' : '') + entry.value.service)
    if (deep) {
      console.log('Username:', entry.value.username || '')
      console.log('Url:', entry.value.url || '')
      console.log('Notes:', entry.value.notes || '')
    }
  })
}

function copyPassword(entry) {
  if (entry.value.password) {
    clipboard.write(entry.value.password)
    console.log('Your password has been coopied to your clipboard and will be overwritten in 5 seconds.')
    setTimeout(() => {
      clipboard.write('')
    }, 5000)
  }
}

function generatePassword() {
  let password = passwordGenerator.generatePassword(PASSWORD_OPTIONS)
  return password
}

function listEntries(coconut) {
  printEntries(coconut.entries, true)
}

function search(coconut, query, options) {
  let results = coconut.search(query)
  printEntries(results, true)

  if (results.length) {
    pickOne(results, entry => {
      if (options.delete) {
        remove(coconut, entry)
      } else if (options.update) {
        update(coconut, entry)
      } else {
        get(coconut, entry)
      }
    })
  } else {
    console.error('No results for your query')
  }
}

function pickOne(entries, callback) {
  if (!entries.length) {
    callback()
  } else if (entries.length === 1) {
    callback(entries[0])
  } else {
    promptHandler(prompts.number, (err, result) => {
      if (result.number >= entries.length) {
        console.error('No such entry')
      } else {
        callback(entries[result.number])
      }
    })
  }
}

function get(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  printEntries(entry, false, true)
  copyPassword(entry)
}

function add(coconut) {
  promptHandler(prompts.add, (err, result) => {
    result.password = result.password || generatePassword()
    coconut.addEntry(result.service, result.username, result.password,
        result.url, result.notes)
      .then(() => writeHash(coconut.hash))
      .catch(error => console.error(error.message))
  })
}

function remove(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  printEntries(entry, false, true)
  promptHandler(prompts.deleteConfirm, (err, result) => {
    if (result.deleteConfirm.toLowerCase() == "y") {
      coconut.remove(entry.hash)
        .then(() => writeHash(coconut.hash))
    }
  })
}

function update(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  promptHandler(prompts.add, (err, result) => {
    result.password = result.password || generatePassword()
    promptHandler(prompts.update, (err2, result2) => {
      if (result2.confirm.toLowerCase() === 'y') {
        coconut.updateEntry(entry.hash, result.service, result.username, result.password,
            result.url, result.notes)
          .then(() => writeHash(coconut.hash))
          .catch(error => console.error(error.message))
      }
    })
  })
}

program
  .version(packageJson.version)

program
  .command('list')
  .description('List of all entries')
  .action(() => openDB(listEntries));

program
  .command('search <query>')
  .description('Search for entries')
  .option('-d, --delete', 'Delete the entry from the search')
  .option('-u, --update', 'Update the entry from the search')
  .action((query, options) => {
    openDB(coconut => search(coconut, query, options))
  })

program
  .command('add')
  .description('Add an entry')
  .action(() => openOrCreateDB(add))

program
  .command('server')
  .option('-s, --set <address>', 'Set a server to sync with')
  .option('-r, --remove', 'Remove a server')
  .description('Handle server')
  .action(options => {
    if (options.set) {
      addServer(options.set)
    } else if (options.remove) {
      removeServer()
    } else {
      printServer()
    }
  })

program
  .command('hash')
  .description('Get current root hash')
  .action(() => safeReadConfig(config => console.log(config.hash)))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// vim: sw=2

