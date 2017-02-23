#!/usr/bin/env node

const fs = require('fs'),
      os = require('os'),
      Coconut = require('../src/coconut'),
      program = require('commander'),
      prompt = require('prompt'),
      packageJson = require('../package.json')

const HASH_FILE = os.homedir() + '/.local/share/coconut'

prompt.message = ''

//let coconut

function openDB(callback) {
  fs.readFile(HASH_FILE, (error, data) => {
    if (error) {
      //program.parse(process.argv)
      console.log('Coconut is not initialized. \nPlease run \'coconut init\'')
      process.exit()
    } else {
      prompt.get({
          properties: {
            masterPassword: {
              hidden: true,
              message: 'Master password'
            },
          }
        }, (error, result) => {
          let coconut = new Coconut(result.masterPassword)
          coconut.connect(data.toString().trim()).then(() => {
            callback(coconut)
          }).catch((err) => {
            console.log(err.message)
          })
        })
    }
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
    openDB((coconut) => {
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
    openDB((coconut) => {
      console.log(coconut.entries)
    })
  })

program
  .command('search')
  .description('Search for entries')
  .action(() => {
    openDB((coconut) => {
      console.log(coconut.search(process.argv[3]))
    })
  })

program.parse(process.argv)

// vim: sw=2

