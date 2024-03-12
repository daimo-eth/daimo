export type TRPCClient = {
  createRequestSponsored: {
    mutate: (input: {
      amount: string;
      recipient: string;
      idString: string;
    }) => Promise<string>;
  };
  lookupEthereumAccountByFid: {
    query: (args: { fid: number }) => Promise<any>;
  };
};
