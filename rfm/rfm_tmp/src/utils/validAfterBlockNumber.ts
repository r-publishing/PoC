const rchainToolkit = require("rchain-toolkit");

const validAfterBlockNumber = async (httpUrlReadOnly: string) => {
    let validAfterBlockNumberResponse;
    try {
      validAfterBlockNumberResponse = JSON.parse(
        await rchainToolkit.http.blocks(httpUrlReadOnly, {
          position: 1,
        })
      )[0].blockNumber;
    } catch (err) {
      console.log('Unable to get last finalized block', 'error');
      console.log(err);
      throw new Error();
    }
    return validAfterBlockNumberResponse;
  };

export default validAfterBlockNumber;