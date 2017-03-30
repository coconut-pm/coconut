#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      path = require('path'),
      program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy'),
      PasswordGenerator = require('password-generator-js'),
      packageJson = require('../package.json'),
      Coconut = require('../src/core/coconut'),
      serverCommunication = require('../src/core/serverCommunication'),
      prompts = require('../src/cli/prompts.json')

const CONFIG_FILE = path.join(os.homedir(), '.coconut')

prompt.message = ''
const PASSWORD_LENGTH = 50

let passwordHash;

function getHash(passwordHash, required) {
  return getRemoteHash(passwordHash)
    .catch(() => getLocalHash())
    .catch(() => {
      if (required) {
        exit('Coconut is not initialized. \nRun \'coconut add\' to get started.')
      } else {
        return Promise.reject('No hash, but it is okay..')
      }
    })
}

function getRemoteHash(passwordHash) {
  return readConfig()
    .then(({ server }) => server || Promise.reject('No remote hash'))
    .then(server => serverCommunication.get(server, passwordHash))
    .then(hash => { console.log('getRemote:', hash); return hash })
    .then(hash => writeHash(hash, true))
}

function getLocalHash() {
  return readConfig()
    .then(({ hash }) => hash || Promise.reject('No local hash'))
}

function sync(coconut, hash) {
  return coconut.connect(hash)
    .catch(error => exit(error, 2))
}

function openCoconut(required) {
  let coconut
  return promptHandler(prompts.masterPassword)
    .then(({ masterPassword }) => coconut = new Coconut(masterPassword))
    .then(() => passwordHash = coconut.passwordHash)
    .then(() => coconut.connectedToIpfs())
    .catch(error => exit(error, 1))
    .then(() => getHash(coconut.passwordHash, required))
    .then(hash => sync(coconut, hash))
    .catch(() => {})
    .then(() => coconut)
}

function readConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile(CONFIG_FILE, (error, data) => {
      if (error) {
        let config = {}
        writeConfig(config)
        resolve(config)
      } else {
        resolve(JSON.parse(data.toString()))
      }
    })
  })
}

function writeHash(hash, avoidSync) {
  console.log('setHash:', hash)
  let config
  readConfig()
    .then(_config => config = Object.assign(_config, { hash }))
    .then(writeConfig)
    .then(() => config.server && !avoidSync ? Promise.resolve() : Promise.reject())
    .then(() => serverCommunication.post(config.server, passwordHash, hash))
    .catch(() => {})
    .then(() => hash)
}

function addServer(server) {
  readConfig()
    .then(config => Object.assign(config, { server }))
    .then(writeConfig)
}

function removeServer() {
  readConfig()
    .then(config => {
      delete config.server
      writeConfig(config)
    })
}

function printServer() {
  readConfig()
    .then(({ server }) => console.log(server
          || 'You have not connected to a server yet.'))
}

function writeConfig(config) {
  return new Promise((resolve, reject) => {
    config = JSON.stringify(config)
    fs.writeFile(CONFIG_FILE, config, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(config)
      }
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
          reject(error.message)
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
  if (entries.length === 1) {
    return Promise.resolve(entries[0])
  } else {
    return promptHandler(prompts.number)
      .then(result => {
        if (result.number >= entries.length) {
          return Promise.reject('No such entry')
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
  return promptHandler(prompts.add)
    .then(result => {
      result.password = result.password
        || PasswordGenerator.generatePassword({ length: PASSWORD_LENGTH })
      return coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes)
    }).then(() => writeHash(coconut.hash))
}

function remove(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  printEntries(entry, false, true)
  return promptHandler(prompts.deleteConfirm)
    .then(result => result.deleteConfirm.toLowerCase() == "y" || Promise.reject())
    .then(() => coconut.remove(entry.hash))
    .catch(() => {})
    .then(() => writeHash(coconut.hash))
}

function update(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  let result
  return promptHandler(prompts.add)
    .then(_result => {
      _result.password = _result.password
        || PasswordGenerator.generatePassword({ length: PASSWORD_LENGTH })
      result = _result
    }).then(() => promptHandler(prompts.update))
    .then(result => result.confirm.toLowerCase() == "y" || Promise.reject())
    .then(() => coconut.updateEntry(entry.hash, result.service, result.username,
          result.password, result.url, result.notes))
    .catch(() => {})
    .then(() => writeHash(coconut.hash))
}

function handleError(error) {
  error = error.message || error
  console.error(error)
}

function exit(error, exitCode) {
  handleError(error)
  process.exit(exitCode)
}

program
  .version(packageJson.version)

program
  .command('list')
  .description('List of all entries')
  .action(() => {
    openCoconut(true)
      .then(listEntries)
      .catch(handleError)
  })

program
  .command('search <query>')
  .description('Search for entries')
  .option('-d, --delete', 'Delete the entry from the search')
  .option('-u, --update', 'Update the entry from the search')
  .action((query, options) => {
    openCoconut(true)
      .then(coconut => search(coconut, query, options))
      .catch(handleError)
  })

program
  .command('add')
  .description('Add an entry')
  .action(() => {
    openCoconut(false)
      .then(add)
      .catch(handleError)
  })

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
  .action(() => readConfig.then(config => console.log(config.hash)))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// vim: sw=2

