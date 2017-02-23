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

let coconut
prompt.get(prompts.masterPassword, (error, result) => {
    coconut = new Coconut(result.masterPassword)
    fs.readFile(HASH_FILE, (error, data) => {
      if (error) {
        program.parse(process.argv)
      } else {
        coconut.connect(data.toString().trim()).then(() => {
          program.parse(process.argv)
        }).catch((err) => console.log(err.message))
      }
    })
  })

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
  .command('add')
  .description('Add an entry')
  .action(() => {
    prompt.get(prompts.list, (err, result) => {
      coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes).then(() => {
        writeHash(coconut.hash, (error) => {
          if (error) {
            console.error(error)
          }
        })
      })
    })
  });

program
  .command('list')
  .description('List of all entries')
  .action(() => {
    printEntries(coconut.entries, true)
  })

program
  .command('search')
  .description('Search for entries')
  .action(() => {
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

// vim: sw=2

