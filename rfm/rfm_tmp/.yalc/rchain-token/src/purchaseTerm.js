/* GENERATED CODE, only edit rholang/*.rho files*/
module.exports.purchaseTerm = (
  payload
) => {
  return `
new
  basket,
  revVaultCh,
  boxCh,

  returnCh,
  quantityCh,
  mergeCh,
  publicKeyCh,
  priceCh,
  newIdCh,
  dataCh,
  //feesCh,
  purseIdCh,
  contractIdCh,

  revAddressCh,
  contractExistsCh,
  proceed1Ch,
  proceed2Ch,
  registryLookup(\`rho:registry:lookup\`),
  deployerId(\`rho:rchain:deployerId\`),
  stdout(\`rho:io:stdout\`),
  revAddress(\`rho:rev:address\`)
in {

  purseIdCh!!("${payload.purseId}") |
  contractIdCh!!("${payload.contractId}") |
  newIdCh!!("${payload.newId ? payload.newId : ""}") |
  priceCh!!(${payload.price || "Nil"}) |
  mergeCh!!(${payload.merge}) |
  quantityCh!!(${payload.quantity}) |
  publicKeyCh!!("${payload.publicKey}") |
  dataCh!!("${payload.data}") |
  //feesCh!!("PURCHASE_PURSE_${payload.fee ? "(" + payload.fee.join(',') + ")" : "Nil"}S") |

  for (boxCh <<- @(*deployerId, "rchain-token-box", "${payload.masterRegistryUri}", "${payload.boxId}")) {

    registryLookup!(\`rho:id:${payload.masterRegistryUri}\`, *contractExistsCh) |
    for (_ <- contractExistsCh) {
      proceed1Ch!(Nil)
    } |

    registryLookup!(\`rho:rchain:revVault\`, *revVaultCh) |

    /*
      Create a vault/purse that is just used once (purse)
    */
    for(@(_, *RevVault) <- revVaultCh; _ <- proceed1Ch) {
      new unf, purseRevAddrCh, purseAuthKeyCh, purseVaultCh, deployerRevAddressCh, RevVaultCh, deployerVaultCh, deployerAuthKeyCh in {
        revAddress!("fromUnforgeable", *unf, *purseRevAddrCh) |
        RevVault!("unforgeableAuthKey", *unf, *purseAuthKeyCh) |
        for (@purseAuthKey <- purseAuthKeyCh; @purseRevAddr <- purseRevAddrCh) {

          RevVault!("findOrCreate", purseRevAddr, *purseVaultCh) |

          for (
            @(true, purseVault) <- purseVaultCh;
            @publicKey <- publicKeyCh;
            @purseId <- purseIdCh;
            @merge <- mergeCh;
            @contractId <- contractIdCh;
            @price <- priceCh;
            @quantity <- quantityCh;
            @newId <- newIdCh;
            @data <- dataCh
            //@fees <- feesCh
          ) {

            stdout!({
              "publicKey": publicKey,
              "price": price,
              "merge": merge,
              "quantity": quantity,
              "purseId": purseId,
              "contractId": contractId,
              "newId": newId,
            }) |
            match {
              "publicKey": publicKey,
              "price": price,
              "merge": merge,
              "quantity": quantity,
              "purseId": purseId,
              "contractId": contractId,
              "newId": newId,
            } {
              {
                "publicKey": String,
                "price": Int,
                "merge": Bool,
                "quantity": Int,
                "purseId": String,
                "contractId": String,
                "newId": String,
              } => {
                proceed2Ch!(Nil)
              }
              _ => {
                basket!({ "status": "failed", "message": "error: invalid payload, cancelled purchase and payment" }) |
                stdout!(("failed", "error: invalid payload, cancelled purchase and payment"))
              }
            } |

            for (_ <- proceed2Ch) {

              revAddress!("fromPublicKey", publicKey.hexToBytes(), *deployerRevAddressCh) |
              registryLookup!(\`rho:rchain:revVault\`, *RevVaultCh) |
              for (@(_, RevVault) <- RevVaultCh; @deployerRevAddress <- deployerRevAddressCh) {
                
                // send price * quantity dust in purse
                @RevVault!("findOrCreate", deployerRevAddress, *deployerVaultCh) |
                @RevVault!("deployerAuthKey", *deployerId, *deployerAuthKeyCh) |
                for (@(true, deployerVault) <- deployerVaultCh; @deployerAuthKey <- deployerAuthKeyCh) {

                  stdout!(("Beginning transfer of ", price * quantity, "dust from", deployerRevAddress, "to", purseRevAddr)) |

                  new resultCh, entryCh in {
                    @deployerVault!("transfer", purseRevAddr, price * quantity, deployerAuthKey, *resultCh) |
                    for (@result <- resultCh) {

                      stdout!(("Finished transfer of ", price * quantity, "dust to", purseRevAddr, "result was:", result)) |
                      match result {
                        (true, Nil) => {
                          boxCh!((
                            "PURCHASE",
                            {
                              "contractId": contractId,
                              "purseId": purseId,
                              "data": data,
                              "quantity": quantity,
                              "merge": merge,
                              "newId": newId,
                              "purseRevAddr": purseRevAddr,
                              "purseAuthKey": purseAuthKey
                            },
                            *returnCh
                          )) |
                          for (@r <- returnCh) {
                            match r {
                              String => {
                                new refundPurseBalanceCh, refundResultCh in {
                                  @purseVault!("balance", *refundPurseBalanceCh) |
                                  for (@balance <- refundPurseBalanceCh) {
                                    if (balance != price * quantity) {
                                      stdout!("error: CRITICAL, purchase was not successful and balance of purse is now different from price * quantity")
                                    } |
                                    @purseVault!("transfer", deployerRevAddress, balance, purseAuthKey, *refundResultCh) |
                                    for (@result <- refundResultCh)  {
                                      match result {
                                        (true, Nil) => {
                                          match "error: purchase failed but was able to refund \${balance} " %% { "balance": balance } ++ r {
                                            s => {
                                              basket!({ "status": "failed", "message": s }) |
                                              stdout!(s)
                                            }
                                          }
                                        }
                                        _ => {
                                          stdout!(result) |
                                          match "error: CRITICAL purchase failed and was NOT ABLE to refund \${balance} " %% { "balance": balance } ++ r {
                                            s => {
                                              basket!({ "status": "failed", "message": s }) |
                                              stdout!(s)
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              _ => {
                                basket!({ "status": "completed" }) |
                                stdout!("completed, purchase successful")
                              }
                            }
                          }
                        }
                        _ => {
                          basket!({ "status": "failed", "message": result }) |
                          stdout!(("failed", result))
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;
};
