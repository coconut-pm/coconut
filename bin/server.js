#!/usr/bin/env node

const express = require('express'),
      bodyParser = require('body-parser'),
      fs = require('fs'),
      path = require('path'),
      IpfsAPI = require('ipfs-api'),
      storage = require('node-persist'),
      cors = require('cors'),
      serverCommunication = require('../src/core/serverCommunication')

const app = express()
const ipfs = new IpfsAPI()
const servers = process.argv.slice(2)

storage.initSync()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  if (req.query.password) {
    let password = req.query.password
    storage.getItem(password)
      .then(res.send.bind(res))
      .catch(error => console.error(error.message))
  } else {
    res.sendFile(path.resolve('src/www/resources/coconut.svg'))
  }
})

app.post('/', (req, res) => {
  let password = req.body.password
  let hash = req.body.hash
  setTimeout(storage.setItemSync.bind(storage, password, hash))
  pinObjects(hash)
  servers.forEach(server => {
    serverCommunication.post(server, password, hash)
  })
  res.end()
})

app.listen(9000, () => {
  console.log('Server running on port 9000.')
})

function pinObjects(hash) {
  if (hash) {
    ipfs.pin.add(hash)
    ipfs.object.get(hash).then(node => {
      let data = JSON.parse(node._data)
      let next = data.items || data.next
      pinObjects(next[0])
    })
  }
}

// vim: sw=2

