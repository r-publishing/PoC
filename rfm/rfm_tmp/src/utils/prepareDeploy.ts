import * as rchainToolkit from 'rchain-toolkit';

const prepareDeploy = async (
    httpUrlReadOnly: string,
    publicKey: string,
    timestamp: number
  ) => {
    let prepareDeployResponse;
    try {
      prepareDeployResponse = await rchainToolkit.http.prepareDeploy(
        httpUrlReadOnly,
        {
          deployer: publicKey,
          timestamp: timestamp,
          nameQty: 1,
        }
      );
    } catch (err) {
      console.log(err);
      throw new Error('Unable to prepare deploy');
    }
  
    return prepareDeployResponse;
  };

  export default prepareDeploy;