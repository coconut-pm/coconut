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
    .catch(error => {
      if (error.message === 'Failed to fetch') {
        document.querySelector('#error').textContent = 'Not connected to IPFS'
      } else {
        document.querySelector('#error').textContent = 'Wrong password'
      }
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
    return Promise.reject()
  }
}

function loggedIn() {
  listEntries()
  document.querySelector('body').classList.add('open')
  document.querySelector('#add').classList.add('show')
  document.querySelector('ul').classList.add('show')
  document.querySelector('#search').focus()
}

function updateHash() {
  let hash = coconut.hash
  let server = localStorage.getItem('server')

  localStorage.setItem('hash', hash)
  if (server) {
    serverCommunication.post(server, coconut.passwordHash, hash)
      .catch(alert.bind(this, 'Server is unreachable. This modification will be overwritten when the server is reachable again.'))
  }
}

function listEntries(entries = coconut.entries) {
  document.querySelector('ul').innerHTML =
    `${entries.map(listEntry).join('\n')}`
}

function listEntry(entry) {
  return `<li><a href="#" onclick="show(\'${entry.hash}\')">${entry.value.service}</a></li>`
}

function copyPassword() {
  document.querySelector('#password').select()
  if (!document.execCommand('copy')) {
    alert('Your browser does not support this feature')
  }
}

function add() {
  modifyFunction = coconut.addEntry.bind(coconut)
  closeEntry()
  document.querySelector('#add').classList.remove('show')
  document.querySelector('ul').classList.remove('show')
  document.forms.modify.classList.add('show')
}

function edit(hash) {
  let form = document.forms.modify

  let entry = coconut.get(hash).value
  form.service.value = entry.service
  form.username.value = entry.username
  form.password.value = entry.password
  form.url.value = entry.url
  form.notes.value = entry.notes

  modifyFunction = coconut.updateEntry.bind(coconut, hash)
  closeEntry()
  document.querySelector('#add').classList.remove('show')
  document.querySelector('ul').classList.remove('show')
  form.classList.add('show')
}

function remove(hash) {
  coconut.remove(hash)
    .then(closeEntry)
    .then(modified)
}

function doModify(form) {
  modifyFunction(
    form.service.value,
    form.username.value,
    form.password.value || PasswordGenerator.generatePassword({ length: 50 }),
    form.url.value,
    form.notes.value
  ).then(modified)
  closeModify()

  return false
}

function modified() {
  updateHash()
  listEntries()
}

function show(hash) {
  closeModify()
  document.querySelector('#add').classList.remove('show')

  document.querySelector('#edit').onclick = edit.bind(this, hash)
  document.querySelector('#delete').onclick = remove.bind(this, hash)

  let entry = coconut.get(hash).value
  document.querySelector('#service').textContent = entry.service
  document.querySelector('#username').textContent = entry.username
  document.querySelector('#url').textContent = entry.url
  document.querySelector('#notes').textContent = entry.notes
  document.querySelector('#password').value = entry.password
  document.querySelector('#entry').classList.add('show')
}

function closeEntry() {
  let entry = document.querySelector('#entry')
  if (entry.classList.contains('show')) {
    entry.classList.remove('show')
    document.querySelector('#add').classList.add('show')
  }
}

function closeModify() {
  let modify = document.querySelector('#modify')
  if (modify.classList.contains('show')) {
    modify.classList.remove('show')
    modify.reset()
    document.querySelector('ul').classList.add('show')
    document.querySelector('#add').classList.add('show')
  }
}

function setServer(form) {
  localStorage.setItem('server', form.server.value)
  return false
}

function search(input) {
  let entries = coconut.search(input.value)
  listEntries(entries)
}

// vim: sw=2

