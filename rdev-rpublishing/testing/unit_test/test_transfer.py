#!/usr/bin/python3

from rchain.crypto import PrivateKey
from pyrdev.rdev import rdevAPI

rdev = rdevAPI('localhost')
new1 = PrivateKey.generate()
admin = rdev.get_private_key('bootstrap')

balance = rdev.checkBalance(admin.get_public_key().get_rev_address())
assert balance != 0

balance = rdev.checkBalance(new1.get_public_key().get_rev_address())
assert balance == 0

funds = 12300000000
result = rdev.transfer(admin.get_public_key().get_rev_address(), new1.get_public_key().get_rev_address(), funds, admin)
print("Fund:    ", result[0], " => ", result[1])
assert result[0]

balance = rdev.checkBalance(new1.get_public_key().get_rev_address())
assert balance == funds

funds = funds - 100000000
result = rdev.transfer(new1.get_public_key().get_rev_address(), admin.get_public_key().get_rev_address(), funds, new1)
print("refund:  ", result[0], " => ", result[1])
assert result[0]

# Can't put it all back due to gas fees
balance = rdev.checkBalance(new1.get_public_key().get_rev_address())
assert balance < 100000000

result = rdev.transfer(new1.get_public_key().get_rev_address(), admin.get_public_key().get_rev_address(), 100000000, new1)
print("too much:", result[0], "=> ", result[1])
assert result[0] == False

result = rdev.transfer(new1.get_public_key().get_rev_address(), "111111177777", 1000, new1)
print("Bad REV: ", result[0], "=> ", result[1])
assert result[0] == False
