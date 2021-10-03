#!/usr/bin/python3

from pyrdev.rdev import rdevAPI
import pathlib

if __name__ != pathlib.Path(__file__).stem and __name__ != '__main__':
    assert False

rdev = rdevAPI('localhost')
new1 = rdev.get_private_key('anonymous')
admin = rdev.get_private_key('bootstrap')

balance = rdev.checkBalance(new1.get_public_key().get_rev_address())
assert balance == 0

balance = rdev.checkBalance(admin.get_public_key().get_rev_address())
assert balance != 0
