import { registerAs } from '@nestjs/config';

export default registerAs('dao', () => {
  return {
    contractName: process.env.DAO_CONTRACT_NAME,
    tokenFactoryContractName: process.env.DAO_TOKEN_FACTORY_CONTRACT_NAME,
    bridgeTokenFactoryContractName:
      process.env.DAO_BRIDGE_TOKEN_FACTORY_CONTRACT_NAME,
  };
});
