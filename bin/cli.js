#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      path = require('path');
      program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy');
      PasswordGenerator = require('strict-password-generator').default,
      packageJson = require('../package.json')
      Coconut = require('../src/coconut'),
      prompts = require('../src/cli_prompts.json')

const HASH_FILE = path.join(os.homedir(), '.coconut')
const passwordGenerator = new PasswordGenerator()

prompt.message = ''
const PASSWORD_OPTIONS = { exactLength: 50 }

function openDB(callback) {
  fs.readFile(HASH_FILE, (error, data) => {
    if (error) {
      console.log('Coconut is not initialized. \nPlease run \'coconut init\'')
      process.exit()
    } else {
      promptHandler(prompts.masterPassword, (error, result) => {
        let coconut = new Coconut(result.masterPassword)
        coconut.connect(data.toString().trim()).then(() => {
          callback(coconut)
        }).catch((err) => console.error(err.message))
      })
    }
  })
}

function createDB(hash) {
  if (hash) {
    writeHash(hash)
  } else {
    promptHandler(prompts.masterPassword, (error, result) => {
      let coconut = new Coconut(result.masterPassword)
      coconut.addEntry('Coconut', undefined, result.masterPasssword, 'http://coco.nut', 'This is created to create a hash')
        .then(() => {
          writeHash(coconut.hash)
        })
    })
  }
}

function writeHash(hash, callback) {
  callback = callback || (error => error && console.error(error))
  fs.writeFile(HASH_FILE, hash, callback)
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
  clipboard.write(entry.value.password)
  console.log('Your password has been coopied to your clipboard and will be overwritten in 5 seconds.')
  setTimeout(() => {
    clipboard.write('')
  }, 5000)
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
  .command('init [hash]')
  .description('Initialize the password database')
  .action(createDB)

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
  .action(() => openDB(add));

program
  .command('hash')
  .description('Get current root hash')
  .action(() => openDB(coconut => console.log(coconut.hash)))

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

// vim: sw=2

