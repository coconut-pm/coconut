#!/usr/bin/env node

const express = require('express'),
      bodyParser = require('body-parser'),
      IpfsAPI = require('ipfs-api'),
      storage = require('node-persist')

const DB_NAME = 'coconut'

const app = express()
const ipfs = new IpfsAPI()

storage.initSync()

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  let password = req.query.password
  storage.getItem(password)
    .then(res.send.bind(res))
    .catch(errorHandler)
})

app.post('/', (req, res) => {
  let password = req.body.password
  let hash = req.body.hash
  storage.setItem(password, hash).catch(errorHandler)
  pinObjects(hash)
  res.end()
})

function errorHandler(error) {
  if (error) {
    console.error(error)
  }
}

app.listen(9000, () => {
  console.log('Server running on port 9000.')
})

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

