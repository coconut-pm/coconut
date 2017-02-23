#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      Coconut = require('../src/coconut'),
      program = require('commander'),
      prompt = require('prompt'),
      packageJson = require('../package.json')

const HASH_FILE = os.homedir() + '/.local/share/coconut'

prompt.message = ''

let coconut
fs.readFile(HASH_FILE, (error, data) => {
  if (error) {
    //program.parse(process.argv)
    console.log('Coconut is not initialized. \nPlease run \'coconut init\'')
    process.exit()
  } else {
    mainPrompt(data.toString().trim())
  }
})

function mainPrompt(hash) {
  prompt.get({
      properties: {
        masterPassword: {
          hidden: true,
          message: 'Master password'
        },
      }
    }, (error, result) => {
      coconut = new Coconut(result.masterPassword)
      coconut.connect(hash).then(() => {
        program.parse(process.argv)
      }).catch((err) => {
        console.log(err.message)
      })
    })
}

function writeHash(hash, callback) {
  fs.writeFile(HASH_FILE, hash, callback)
}

program
  .version(packageJson.version)

program
  .command('add')
  .description('Add an entry')
  .action(() => {
    prompt.get({
      properties: {
        service: {
          required: true
        },
        username: {
          require: true
        },
        password: {
          hidden: true,
        },
        url: {},
        notes: {}
      }
    }, (err, result) => {
      coconut.addEntry(result.service, result.username, result.password,
          result.url, result.notes).then(() => {
        writeHash(coconut.hash, console.log.bind(console))
      })
    })
  });

program
  .command('init')
  .description('Initialize the password database')
  .action(() => {
  })

program
  .command('list')
  .description('List of all entries')
  .action(() => {
    console.log(coconut.entries)
  })

program
  .command('search')
  .description('Search for entries')
  .action(() => {
    console.log(coconut.search(process.argv[3]))
  })

// vim: sw=2

