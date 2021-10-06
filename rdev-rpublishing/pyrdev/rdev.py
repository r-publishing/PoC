import string
import time
import requests
from typing import Mapping

from types import TracebackType
from typing import Optional, Type

from rchain.client import RClient
from rchain.crypto import PrivateKey

import pathlib
PYRGOV = pathlib.Path(__file__).parent.resolve()
BASEPATH = PYRGOV.parent

# these are predefined param
TRANSFER_PHLO_LIMIT = 1000000
TRANSFER_PHLO_PRICE = 1

PRIVATE_KEYS = BASEPATH.joinpath('bootstrap', 'PrivateKeys')
CHECK_BALANCE_RHO_TPL = BASEPATH.joinpath('src', 'actions', 'checkBalance.rho')
TRANSFER_RHO_TPL = BASEPATH.joinpath('src', 'actions', 'transfer.rho')

MASTERURI = BASEPATH.joinpath('src')

LOCALHOST = {
    'observerBase': {'url': 'http://', 'host': 'localhost', 'port': 40402},
    'validatorBase': {'url': 'http://', 'host': 'localhost', 'port': 40403, 'num': 1},
    'adminBase': {'url': 'http://', 'host': 'localhost', 'port': 40405}
}
TESTNET = {
    'observerBase': {'url': 'https://', 'host': 'observer.testnet.rchain.coop', 'port': 443},
    'validatorBase': {'url': 'https://', 'host': 'node1.testnet.rchain-dev.tk', 'port': 443, 'num': 1},
    'adminBase': {'url': '', 'host': '', 'port': 0}
}
RHOBOTNET = {
    'observerBase': {'url': 'https://', 'host': 'rnodeapi.rhobot.net', 'port': 443},
    'validatorBase': {'url': 'https://', 'host': 'rnodeapi.rhobot.net', 'port': 443, 'num': 1},
    'adminBase': {'url': 'https://', 'host': 'rnodeadmin.rhobot.net', 'port': 443}
}
MAINNET = {
    'observerBase': {'url': 'https://', 'host': 'observer.services.mainnet.rchain.coop', 'port': 443},
    'validatorBase': {'url': 'https://', 'host': 'node12.root-shard.mainnet.rchain.coop', 'port': 443, 'num': 1},
    'adminBase': {'url': '', 'host': '', 'port': 0}
}

NETWORKS = {
    'localhost': LOCALHOST,
    'testnet': TESTNET,
    'rhobot': RHOBOTNET,
    'mainnet': MAINNET,
}

def render_contract_template(template_file: pathlib, substitutions: Mapping[str, str]) -> str:
    file = template_file.open()
    template = file.read()
    file.close()
    contract = string.Template(template).substitute(substitutions)
    return contract

class rdevAPI:

    def __init__(self, net_name: str):
        if net_name in NETWORKS:
            #print('Using ', net_name)
            network = NETWORKS[net_name]
            self.client = RClient(network['observerBase']['host'], network['observerBase']['port'])
            self.network = network
            self.net_name = net_name
            self.keyVault = self.import_shared_private_keys()
        else:
            reason = 'Network ' + net_name + ' NOT Found as an option'
            raise Exception(reason)

    def close(self) -> None:
        self.client.close()

    def __enter__(self) -> 'rdevAPI':
        return self

    def __exit__(self, exc_type: Optional[Type[BaseException]],
                 exc_val: Optional[BaseException],
                 exc_tb: Optional[TracebackType]) -> None:
        self.close()

    def import_shared_private_keys(self) -> Mapping[str, str]:
        search = PRIVATE_KEYS
        keys = {}
        for fname in search.glob("pk.*"):
            name = fname.suffix[1:]
            file = fname.open()
            pk = file.read()
            file.close()
            keys[name] = pk
        return keys

    def get_private_key(self, name: str) -> PrivateKey:
        if name == 'anonymous':
            return PrivateKey.generate() # Warning potential Ambient Access, if account is given REV
        if name in self.keyVault:
            return PrivateKey.from_hex(self.keyVault[name])
        reason = 'No key found in vault for ' + name
        raise Exception(reason)

    def propose(self) -> None:
        if self.network['adminBase']['url']:
            url = self.network['adminBase']['url'] + self.network['adminBase']['host']
            if self.network['adminBase']['port'] > 0:
                url += ':' + str(self.network['adminBase']['port'])

            url += '/api/propose'
            time.sleep(0.5)
            result = requests.post(url)
            return result.json()

    def checkBalance(self, rev_addr: str, block_hash: str='') -> int:
        contract = render_contract_template(
            CHECK_BALANCE_RHO_TPL,
            {'addr': rev_addr, 'myBalance': "mybal",
            'rev': "${rev}", 'fraction': "${fraction}", 'num': "${num}"},
        )
        result = self.client.exploratory_deploy(contract, block_hash)
        if result[0].exprs[0].HasField("e_list_body"):
            return result[0].exprs[0].e_list_body.ps[2].exprs[0].g_int
        if result[1].exprs[0].HasField("e_list_body"):
            return result[1].exprs[0].e_list_body.ps[2].exprs[0].g_int

    def transfer(self, from_addr: str, to_addr: str, amount: int, key: PrivateKey) -> str:
        contract = render_contract_template(
            TRANSFER_RHO_TPL,
            {'from': from_addr, 'to': to_addr, 'amount': amount},
        )
        deployId = self.client.deploy_with_vabn_filled(key, contract, TRANSFER_PHLO_PRICE, TRANSFER_PHLO_LIMIT)
        #print("transfer ", deployId)
        self.propose()
        result = self.client.get_data_at_deploy_id(deployId, 5)
        result = result.blockInfo[0].postBlockData[0].exprs[0].e_tuple_body
        status = result.ps[0].exprs[0].g_bool
        msg = result.ps[1].exprs[0].g_string
        return [status, msg]
