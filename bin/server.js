#!/usr/bin/env node

const path = require('path'),
      os = require('os'),
      fs = require('fs'),
      express = require('express'),
      bodyParser = require('body-parser'),
      IPFS = require('ipfs-api'),
      OrbitDB = require('orbit-db')

const DB_NAME = 'coconut'
const CONFIG_FILE = path.join(os.homedir(), '.coconut-server')

const app = express()
const ipfs = new IPFS()
const orbitdb = new OrbitDB(ipfs)
const store = orbitdb.feed(DB_NAME)

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  fs.readFile(CONFIG_FILE, (error, data) => {
    if (error) {
      res.send('undefined')
    } else {
      res.send(data.toString().trim())
    }
  })
})

app.post('/', (req, res) => {
  let hash = req.body.hash
  fs.writeFile(CONFIG_FILE, hash, error => error && console.error(error))
  store.sync(hash)
  res.end()
})

app.listen(9000, () => {
  console.log('Server running on port 9000.')
})

// vim: sw=2

