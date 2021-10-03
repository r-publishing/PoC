# RChain RDev

This project aims to create an environment to support the active development of rholang.
The RDev developer environment owes its history to the efforts of the [rchain-community](https://github.com/rchain-community), with special note going to the [RGov team](https://github.com/rchain-community/rgov).
Contributors using `vscode` are encouraged to install the [rholang extension](https://marketplace.visualstudio.com/items?itemName=tgrospic.rholang), as development of rholang sometimes requires more than a simple web interface.

## To run RNode stand-alone on localhost:
for bootstrapping, snapshots, and updating a rdev localhost instance for linux and Windows-10 WSL2

Watch video of how to run an rnode localhost and add rgov actions here https://youtu.be/9TIPXXSXwnE bootstraping updates https://youtu.be/fuXFDRXJsVM

## localhost deployment and development
To create an rchain node locally, deploy rchain dependencies, and deploy rdev use the following commands. These commands will:
  1) Create several log files in `bootstrap/log`, which can be largely ignored.
  2) clone the [rchain](https://github.com/rchain/rchain) repository
  3) deploy rholang files from RChain and RDev
  4) Create a master dictionary
  5) Place references to RDev rholang functionality into the master dictionary under a key using the rholang filename
  6) Generate a JSON file containing the URI of the master dictionary: `src/networks/MasterURI.localhost.json`
  7) Create a restorable [snapshot](snapshots) containing that can be restored with `restore-snapshot bootstrap`.
  8) Create a restorable [snapshot](snapshots) containing that can be restored with `restore-snapshot rdev`
  9) Place the bootstrap rnode log file in `bootstrap/log/run-rnode.log`

```bash
cd bootstrap
./bootstrap
./deploy-all
./run-rnode
cd ..
```

## dev interface installation
```bash
npm install
```

## running dev interface
This command will bundle the RDev JavaScript, build the RDev web page, and open your browser to rdev.
```bash
npm start
```

## snapshots
Restore a snapshot previously created with `create-snapshot`
```bash
cd bootstrap && restore-snapshot
```

After initial bootstrap and deploy-all, there will be two snapshots available: `bootstrap` and `rdev`

List snapshots available for restore
```bash
cd bootstrap
list-snapshot
```

Save a copy of the localhost rnode that can be restored at a later date
```bash
cd bootstrap  && create-snapshot
```

## Command line deployment of rholang
Deploy the rholang file "test.rho"
```bash
cd bootstrap
./deploy ../test.rho
```
Propose the previously deployed rholang file "test.rho"
```bash
bootstrap/propose
```
