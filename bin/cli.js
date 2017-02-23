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
prompt.get({
    properties: {
      masterPassword: {
        hidden: true,
        message: 'Master password'
      },
    }
  }, (error, result) => {
    coconut = new Coconut(result.masterPassword)
    fs.readFile(HASH_FILE, (error, data) => {
      if (error) {
        program.parse(process.argv)
      } else {
        coconut.connect(data.toString().trim()).then(() => {
          program.parse(process.argv)
        })
      }
    })
  })

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
  .command('list')
  .description('List of all entries')
  .action(() => {
    console.log(coconut.entries)
  })

// vim: sw=2

