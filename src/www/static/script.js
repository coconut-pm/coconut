let coconut
let modifyFunction

window.onload = () => {
  document.forms.server.server.value = localStorage.getItem('server')
}

function passwordEntered(form) {
  coconut = new Coconut(form.password.value)
  getHash()
    .then(coconut.connect.bind(coconut))
    .then(loggedIn)
    .catch(() => {
      document.querySelector('#incorrectPassword').textContent = 'Wrong password'
    })

  return false
}

function getHash() {
  return getRemoteHash()
    .catch(getLocalHash)
}

function getRemoteHash() {
  let server = localStorage.getItem('server')
  if (server) {
    return serverCommunication.get(server, coconut.passwordHash)
  } else {
    return Promise.reject()
  }
}

function getLocalHash() {
  let hash = localStorage.getItem('hash')
  if (hash) {
    return hash
  } else {
    throw ''
  }
}

function loggedIn() {
  list()
  document.querySelector('body').classList.add('open')
}

function updateHash() {
  let hash = coconut.hash
  let server = localStorage.getItem('server')

  localStorage.setItem('hash', hash)
  if (server) {
    serverCommunication.post(server, coconut.passwordHash, hash)
  }
}

function list() {
  document.querySelector('ul').innerHTML =
    `${coconut.entries.map(listItem).join('\n')}`
}

function listItem(entry) {
  let title = `<a href="#" onclick="show(\'${entry.hash}\')">${entry.value.service}</a>`
  let edit = `<a href="#" onclick="edit(\'${entry.hash}\')">✎</a>`
  let remove = `<a href="#" onclick="remove(\'${entry.hash}\')">✖</a>`
  return `<li>${title} ${edit} ${remove}</li>`
}

function copyPassword() {
  document.querySelector('#password').select()
  if (!document.execCommand('copy')) {
    alert('Your browser does not support this feature')
  }
}

function add() {
  document.querySelector('#modify').classList.add('show')
  modifyFunction = coconut.addEntry.bind(coconut)
}

function edit(hash) {
  document.querySelector('#modify').classList.add('show')
  modifyFunction = coconut.updateEntry.bind(coconut, hash)
}

function remove(hash) {
  coconut.remove(hash)
    .then(modified)
}

function doModify(form) {
  modifyFunction(
    form.service.value,
    form.username.value,
    form.password.value || utils.generatePassword(50),
    form.url.value,
    form.notes.value
  ).then(modified)
  closeModify()

  return false
}

function modified() {
  updateHash()
  list()
}

function show(hash) {
  document.querySelector('#entry').classList.add('show')
  let entry = coconut.get(hash).value
  document.querySelector('#service').textContent = entry.service
  document.querySelector('#username').textContent = entry.username
  document.querySelector('#url').textContent = entry.url
  document.querySelector('#notes').textContent = entry.notes
  document.querySelector('#password').value = entry.password
}

function closeEntry() {
  document.querySelector('#entry').classList.remove('show')
}

function closeModify() {
  let modify = document.querySelector('#modify')
  modify.classList.remove('show')
  modify.reset()
}

function setServer(form) {
  localStorage.setItem('server', form.server.value)
  return false
}

// vim: sw=2

