In order to use RDev, at least one pre-existing private key needs to exist
in order to perform the rnode genesis (this is the validator key).
That private key is stored in `pk.bootstrap`, and is used by all the command line tools when they need to execute something against your rnode.

The other `pk.xxx` files in this directory are conveniences to enable others to access your rnode
for testing.
