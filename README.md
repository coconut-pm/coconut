# Avocado
Avocado is a password manager built using ipfs.

## Entry format
```
entry = {
    id: <integer>,
    field: <service|username|password|url|notes>,
    value: <value>,
}
entry = {
    id: <integer>,
    removed: <boolean>
}

value = {
    nonce: <string>,
    ciphertext: <dyomh>,
}
value = {
    removed: <boolean>
}
```

