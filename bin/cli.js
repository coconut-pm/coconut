#!/usr/bin/env node

const Coconut = require('../src/coconut'),
      program = require('commander'),
      prompt = require('prompt'),
      packageJson = require('../package.json')

prompt.message = ''

program
  .version(packageJson.version)

program
  .command('add')
  .description('Add an entry')
  .action(() => {
    prompt.get({
      properties: {
        masterPassword: {
          hidden: true,
          replace: '*',
          message: 'Master password'
        },
        service: {
          required: true
        },
        username: {
          require: true
        },
        password: {
          hidden: true,
          replace: '*'
        },
        url: {},
        notes: {}
      }
    }, (err, result) => {
      let coconut = new Coconut(masterPassword)
    })
  });

program.parse(process.argv)

// vim: sw=2

