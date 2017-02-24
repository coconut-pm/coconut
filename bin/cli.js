#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      program = require('commander'),
      prompt = require('prompt'),
      clipboard = require('clipboardy');
      packageJson = require('../package.json')
      Coconut = require('../src/coconut'),
      prompts = require('../src/cli_prompts.json')

const HASH_FILE = os.homedir() + '/.local/share/coconut'

prompt.message = ''

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
    writeHash(coconut.hash, error => !!error && console.error(error))
  })
}

function writeHash(hash, callback) {
  fs.writeFile(HASH_FILE, hash, callback)
}

function printEntries(entries, withIndex, deep) {
  if (entries.hash) {
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
  clipboard.write(entry)
  console.log('Your password has been coopied to your clipboard and will be overwritten in 5 secons.')
  setTimeout(() => {
    clipboard.write('')
  }, 5000)
}

function add() {
  openDB((coconut) => {
    prompt.get(prompts.add, (err, result) => {
      coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes).then(() => {
        writeHash(coconut.hash, error => !!error && console.error(error))
      })
    })
  })
}

function listEntries() {
  openDB((coconut) => {
    printEntries(coconut.entries, true)
  })
}

function search(query) {
  openDB((coconut) => {
    let results = coconut.search(query)
    printEntries(results, true)
  })
}

function get(index) {
  openDB((coconut) => {
    printEntries(coconut.entries[index], false, true)
    prompt.get(prompts.copyPassword, (err, result) => {
      if (result.copy.toLowerCase() == "y") {
        copyPassword(coconut.entries[index].value.password)
      }
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
  .action(search)

program
  .command('get <index>')
  .description('View an entry')
  .action(get)

program.parse(process.argv)

// vim: sw=2

