# Avocado
Avocado is a password manager built using ipfs.

## Entry format
```
{
    id: <string>,
    field: <service|username|password|url|notes>,
    value: <value>,
    removed: <boolean>
}

value = {
    nonce: <string>,
    ciphertext: <dyomh>,
    removed: <boolean>
}
```
Where removed is optional.

