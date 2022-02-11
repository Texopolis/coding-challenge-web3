# coding-challenge-web3

coding challenge- chain bridge

This is a high level overview of a web system that can bridge transfers of a stablecoin token from one evm blockchain to a different evm blockchain.

The following system assumes: -there are contracts already deployed on Binance Smart Chain and Polygon that have methods available for us to use -each contract can perform the bridge in both directions (the following just shows from Polygon to Binance)

The logic of this system revolves around the ability to access and store event logs of transactions and compare them to on-chain logs to verify transactions across different evm chains
