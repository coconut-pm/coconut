#!/usr/bin/env node

const program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy'),
      PasswordGenerator = require('password-generator-js'),
      ConfigHandler = require('../src/cli/configHandler'),
      packageJson = require('../package.json'),
      Coconut = require('../src/core/coconut'),
      prompts = require('../src/cli/prompts.json')

prompt.message = ''
const PASSWORD_LENGTH = 50

let passwordHash;

function openCoconut(required) {
  let coconut
  return promptHandler(prompts.masterPassword)
    .then(({ masterPassword }) => coconut = new Coconut(masterPassword))
    .then(() => passwordHash = coconut.passwordHash)
    .then(() => coconut.connectedToIpfs())
    .catch(error => exit(error, 1))
    .then(() => ConfigHandler.getHash(passwordHash, required))
    .then(hash => sync(coconut, hash))
    //.catch(() => {})
    .then(() => coconut)
}

function sync(coconut, hash) {
  return coconut.connect(hash)
    .catch(error => exit(error, 2))
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
    }).then(() => ConfigHandler.writeHash(passwordHash, coconut.hash))
}

function remove(coconut, entry) {
  entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
  printEntries(entry, false, true)
  return promptHandler(prompts.deleteConfirm)
    .then(result => result.deleteConfirm.toLowerCase() == "y" || Promise.reject())
    .then(() => coconut.remove(entry.hash))
    .catch(() => {})
    .then(() => ConfigHandler.writeHash(passwordHash, coconut.hash))
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
    .then(() => ConfigHandler.writeHash(passwordHash, coconut.hash))
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
  .option('-l, --list', 'Show server address')
  .option('-s, --set <address>', 'Set a server to sync with')
  .option('-r, --remove', 'Remove a server')
  .description('Handle server')
  .action(function(options) {
    if (options.list) {
      ConfigHandler.printServer()
        .then(console.log.bind(console))
        .catch(handleError)
    } else if (options.set) {
      ConfigHandler.addServer(options.set)
    } else if (options.remove) {
      ConfigHandler.removeServer()
    } else {
      this.outputHelp()
    }
  })

program
  .command('hash')
  .description('Get current root hash')
  .action(() => ConfigHandler.getLocalHash()
      .then(hash => console.log(hash))
      .catch(handleError))

program
  .command('raw')
  .description('Print stored contents including passwords as json')
  .action(function() {
    openCoconut(true)
      .then(coconut => console.log(coconut.entries.map(entry => entry.value)))
      .catch(handleError)
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// vim: sw=2

