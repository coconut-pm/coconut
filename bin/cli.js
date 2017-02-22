#!/usr/bin/env node

const DB = require('../src/db'),
      program = require('commander'),
      prompt = require('prompt')

program
  .version('0.0.1')

program
  .command('get <entry>')
  .description('Returns an entry by either it\'s number')
  .action(entryId => {
    console.log(db.getEntry(entryId))
  });

// vim: sw=2

