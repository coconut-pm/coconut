#!/usr/bin/env node

const express = require('express'),
      bodyParser = require('body-parser'),
      fs = require('fs'),
      path = require('path'),
      request = require('request'),
      IpfsAPI = require('ipfs-api'),
      storage = require('node-persist')

const DB_NAME = 'coconut'

const app = express()
const ipfs = new IpfsAPI()
const servers = process.argv.slice(2)

storage.initSync()

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
  storage.setItem(password, hash)
    .catch(error => console.error(error.message))
  pinObjects(hash)
  sendToServers(password, hash)
  res.end()
})

app.listen(9000, () => {
  console.log('Server running on port 9000.')
})

function sendToServers(password, hash) {
  servers.forEach(server => {
    request.post(server).form({ hash, password })
  })
}

function pinObjects(hash) {
  ipfs.pin.add(hash)
  ipfs.object.get(hash).then(node => {
    pinRecursive(JSON.parse(node._data).items[0])
  })
}

function pinRecursive(hash) {
  if (hash) {
    ipfs.pin.add(hash)
    ipfs.object.get(hash).then(node => {
      pinRecursive(JSON.parse(node._data).next[0])
    })
  }
}

// vim: sw=2

