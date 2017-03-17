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

function openCoconut(config) {
  return promptHandler(prompts.masterPassword)
    .then(({ masterPassword }) => {
      let coconut = new Coconut(masterPassword)
      passwordHash = coconut.passwordHash
      return syncHash(config)
        .then(() => {
          coconut.connect(config.hash)
            .then(() => {
              return coconut
            }).catch((err) => console.error(err.message))
        })
    })
}

function openDB() {
  return safeReadConfig(config => openCoconut(config))
}

function openOrCreateDB() {
  return readConfig()
    .then(config => {
      return openCoconut(config)
    }).catch(error => {
      promptHandler(prompts.masterPassword)
        .then(({ masterPassword }) => {
          let coconut = new Coconut(masterPassword)
          passwordHash = coconut.passwordHash
          return coconut
        })
    })
}

function syncHash(config) {
  return new Promise((resolve, reject) => {
    if (config.server) {
      let url = config.server + '?password=' + passwordHash
      request(url, (error, response, body) => {
        if (!error && response.statusCode === 200 && body !== 'undefined') {
          return writeHash(body, true)
            .then(() => body)
        } else {
          resolve(config.hash)
        }
      })
    } else {
      resolve(config.hash)
    }
  })
}

function readConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile(CONFIG_FILE, (error, data) => {
      if (error) reject(error)
      else {
        let config = JSON.parse(data.toString())
        resolve(config)
      }
    })
  })
}

function safeReadConfig() {
  return readConfig()
    .catch(error => {
      console.log('Coconut is not initialized. \nRun \'coconut add\' to get started.')
      process.exit()
    })
}


function writeHash(hash, avoidSync) {
  return readConfig()
    .then(config => {
      config.hash = hash
      if (config.server && !avoidSync) {
        request.post(config.server).form({ hash, password: passwordHash })
      }
      return writeConfig(config)
    }).catch(error => writeConfig({ hash: hash }))
}

function addServer(address) {
  readConfig()
    .then(config => {
      config.server = address
      return writeConfig(config)
    }).catch(error => {
      return writeConfig({ server: address })
    })
}

function removeServer() {
  return safeReadConfig()
    .then(config => {
      delete config.server
      return writeConfig(config)
    })
}

function printServer() {
  return safeReadConfig()
    .then(config => {
      console.log(config.server || 'You have not connected to a server yet.')
    })
}

function writeConfig(config) {
  return new Promise((resolve, reject) => {
    config = JSON.stringify(config)
    fs.writeFile(CONFIG_FILE, config, error => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function promptHandler(questions) {
  return new Promise((resolve, reject) => {
    prompt.get(questions, (error, result) => {
      if (error) {
        if (error.message === 'canceled') {
          process.exit()
        } else {
          reject(error)
        }
      } else {
        resolve(result)
      }
    })
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
    pickOne(results)
      .then(entry => {
        if (options.delete) {
          remove(coconut, entry)
        } else if (options.update) {
          update(coconut, entry)
        } else {
          get(coconut, entry)
        }
      }).catch(console.error.bind(console))
  } else {
    console.error('No results for your query')
  }
}

function pickOne(entries) {
  if (!entries.length) {
    return Promise.reject('No entries')
  } else if (entries.length === 1) {
    return Promise.resolve(entries[0])
  } else {
    return promptHandler(prompts.number)
      .then(result => {
        if (result.number >= entries.length) {
          throw 'No such entry'
        } else {
          return entries[result.number]
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
  promptHandler(prompts.add)
    .then(result => {
      result.password = result.password || generatePassword()
      return coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes)
    }).then(() => writeHash(coconut.hash))
    .catch(error => console.error(error.message))
}

function remove(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  printEntries(entry, false, true)
  promptHandler(prompts.deleteConfirm)
    .then(result => {
      if (result.deleteConfirm.toLowerCase() == "y") {
        return coconut.remove(entry.hash)
      }
    }).then(hash => hash && writeHash(coconut.hash))
    .catch(error => console.error(error.message))
}

function update(coconut, entry) {
  let result
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  promptHandler(prompts.add)
    .then(_result => {
      result = _result
      result.password = result.password || generatePassword()
    }).then(() => promptHandler(prompts.update))
    .then(result2 => {
      if (result2.confirm.toLowerCase() === 'y') {
        return coconut.updateEntry(entry.hash, result.service, result.username,
            result.password, result.url, result.notes)
      }
    }).then(() => hash && writeHash(coconut.hash))
    .catch(error => console.error(error.message))
}

program
  .version(packageJson.version)

program
  .command('list')
  .description('List of all entries')
  .action(() => openDB().then(listEntries));

program
  .command('search <query>')
  .description('Search for entries')
  .option('-d, --delete', 'Delete the entry from the search')
  .option('-u, --update', 'Update the entry from the search')
  .action((query, options) => {
    openDB().then(coconut => search(coconut, query, options))
  })

program
  .command('add')
  .description('Add an entry')
  .action(() => openOrCreateDB().then(add))

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
  .action(() => safeReadConfig().then(config => console.log(config.hash)))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// vim: sw=2

