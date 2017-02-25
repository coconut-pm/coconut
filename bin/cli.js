#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy');
      PasswordGenerator = require('strict-password-generator').default,
      packageJson = require('../package.json')
      Coconut = require('../src/coconut'),
      prompts = require('../src/cli_prompts.json')

const HASH_FILE = os.homedir() + '/.local/share/coconut'
const passwordGenerator = new PasswordGenerator()

prompt.message = ''
const PASSWORD_OPTIONS = { exactLength: 50 }

function openDB(callback) {
  fs.readFile(HASH_FILE, (error, data) => {
    if (error) {
      console.log('Coconut is not initialized. \nPlease run \'coconut init\'')
      process.exit()
    } else {
      prompt.get(prompts.masterPassword, (error, result) => {
        let coconut = new Coconut(result.masterPassword)
        coconut.connect(data.toString().trim()).then(() => {
          callback(coconut)
        }).catch((err) => console.error(err.message))
      })
    }
  })
}

function createDB(callback) {
  prompt.get(prompts.masterPassword, (error, result) => {
    let coconut = new Coconut(result.masterPassword)
    writeHash(coconut.hash)
  })
}

function writeHash(hash, callback) {
  callback = callback || (error => error && console.error(error))
  fs.writeFile(HASH_FILE, hash, callback)
}

function printEntries(entries, withIndex, deep) {
  if (!Array.isArray(entries)) {
    entries = [entries]
  }
  entries.forEach((entry, index) => {
    console.log((withIndex ? index + ': ' : '') + entry.value.service)
    if (deep) {
      console.log('Username:', entry.value.username)
      console.log('Url:', entry.value.url)
      console.log('Notes:', entry.value.notes)
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

function add() {
  openDB((coconut) => {
    prompt.get(prompts.add, (err, result) => {
      result.password = result.password || generatePassword()
      coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes).then(() => writeHash(coconut.hash))
    })
  })
}

function listEntries() {
  openDB((coconut) => {
    printEntries(coconut.entries, true)
  })
}

function search(query, options) {
  openDB((coconut) => {
    let results = coconut.search(query)
    printEntries(results, true)

    if (results.length) {
      pickOne(results, entry => {
        if (options.delete) {
          remove(entry)
        } else if (options.update) {
          update(entry)
        } else {
          get(entry)
        }
      })
    } else {
      console.log('No results for your query')
    }
  })
}

function pickOne(entries, callback) {
  if (!entries.length) {
    callback()
  } else if (entries.length === 1) {
    callback(entries[0])
  } else {
    prompt.get(prompts.number, (err, result) => {
      callback(entries[result.number])
    })
  }
}

function get(entry) {
  openDB((coconut) => {
    entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
    printEntries(entry, false, true)
    copyPassword(entry)
  })
}

function remove(entry) {
  openDB((coconut) => {
    entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
    printEntries(entry, false, true)
    prompt.get(prompts.deleteConfirm, (err, result) => {
      if (result.deleteConfirm.toLowerCase() == "y") {
        coconut.remove(entry.hash)
          .then(() => writeHash(coconut.hash))
      }
    })
  })
}

function generatePassword() {
  let password = passwordGenerator.generatePassword(PASSWORD_OPTIONS)
  return password
}

function update(entry) {
  openDB((coconut) => {
    entry = Number.isInteger(entry) ? coconut.entries[entry] : entry
    prompt.get(prompts.add, (err, result) => {
      prompt.get(prompts.update, (err2, result2) => {
        if (result2.confirm.toLowerCase() === 'y') {
          coconut.updateEntry(entry.hash, result.service, result.username, result.password,
              result.url, result.notes).then(() => writeHash(coconut.hash))
        }
      })
    })
  })
}

program
  .version(packageJson.version)

program
  .command('init')
  .description('Initialize the password database')
  .action(createDB)

program
  .command('add')
  .description('Add an entry')
  .action(add);

program
  .command('list')
  .description('List of all entries')
  .action(listEntries)

program
  .command('search <query>')
  .description('Search for entries')
  .option('-d, --delete', 'Delete the entry from the search')
  .option('-u, --update', 'Update the entry from the search')
  .action(search)

program
  .command('get <index>')
  .description('View an entry')
  .action(get)

program
  .command('delete <index>')
  .description('Delete an entry')
  .action(remove)

program
  .command('update <index>')
  .description('Udate an entry')
  .action(update)

program.parse(process.argv)

// vim: sw=2

