const rchainToolkit = require("rchain-toolkit");

const waitForUnforgeable = (name: string, readOnlyUrl: string) => {
    try {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          try {
            let resp: string | undefined = undefined;
            rchainToolkit.http
              .dataAtName(readOnlyUrl, {
                name: {
                  UnforgPrivate: { data: name },
                },
                depth: 3,
              })
              .then((dataAtNameResponse: string) => {
                resp = dataAtNameResponse;
                if (
                  resp &&
                  JSON.parse(resp) &&
                  JSON.parse(resp).exprs &&
                  JSON.parse(resp).exprs.length
                ) {
                  resolve(resp);
                  clearInterval(interval);
                } else {
                  console.log('  .');
                }
              })
              .catch((err: string) => {
                console.log(resp);
                console.log(err);
                throw new Error('wait for unforgeable name');
              });
          } catch (err) {
            console.log(err);
            throw new Error('wait for unforgeable name');
          }
        }, 4000);
      });
    } catch (err) {
      console.log(err);
      throw new Error('wait for unforgeable name');
    }
  };

export default waitForUnforgeable;