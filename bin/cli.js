#!/usr/bin/env node

const db = require('../src/db'),
      program = require('commander');

program
  .version('0.0.1');

program
  .command('get <entry>')
  .description('Returns an entry by either it\'s number')
  .action(entryId => {
    console.log(db.getEntry(entryId));
  });

// vim: sw=2

