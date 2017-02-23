#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      Coconut = require('../src/coconut'),
      program = require('commander'),
      prompt = require('prompt'),
      packageJson = require('../package.json')
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
    writeHash(coconut.hash, console.log.bind(console))
  })
}

function writeHash(hash, callback) {
  fs.writeFile(HASH_FILE, hash, callback)
}

function printEntries(entries, withIndex, deep) {
  entries.forEach((entry, index) => {
    console.log((withIndex ? index + ': ' : '') + entry.value.service)
    if (deep) {
      console.log('Username:', entry.value.username)
      console.log('Url:', entry.value.url)
      console.log('Notes:', entry.value.notes)
    }
  })
}

program
  .version(packageJson.version)

program
  .command('init')
  .description('Initialize the password database')
  .action(() => {
    createDB()
  })

program
  .command('add')
  .description('Add an entry')
  .action(() => {
    openDB((coconut) => {
      prompt.get(prompts.add, (err, result) => {
        coconut.addEntry(result.service, result.username, result.password,
            result.url, result.notes).then(() => {
          writeHash(coconut.hash, error => !!error && console.error(error))
        })
      })
    })
  });

program
  .command('list')
  .description('List of all entries')
  .action(() => {
    openDB((coconut) => {
      printEntries(coconut.entries, true)
    })
  })

program
  .command('search')
  .description('Search for entries')
  .action(() => {
    openDB((coconut) => {
      prompt.get(prompts.search, (err, result) => {
        let results = coconut.search(result.query)
        printEntries(results, true)
        prompt.get(prompts.number, (err, result) => {
          printEntries([results[result.number]], false, true)
          prompt.get(prompts.copyPassword, (err, result) => {
            if (result.copy.toLowerCase() == "y") {
              console.error('not implemented yet')
            }
          })
        })
      })
    })
  })

program.parse(process.argv)

// vim: sw=2

