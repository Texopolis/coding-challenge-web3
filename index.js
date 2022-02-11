//USE ETHERS TO INTERACT WITH CONTRACTS
const ethers = require('ethers')

//USE DOTENV TO STORE CONTRACT ADDRESSES, ABI, WALLET_KEY
require('dotenv').config()

//CHECK BROWSER FOR METAMASK WALLET

async function CheckForMetamask() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            await window.ethereum.enable();
            ethereum.request({
                method: 'eth_accounts'
            }).then((res) => {
                document.getElementById('address').innerHTML = res[0];
            });
            return true;
        } catch (error) {
            return false;
        }
    } else {
        return false;
    }
}

let isMetamask = await CheckForMetamask()




//THIS WILL MOVE USDC FROM POLYGON TO BINANCE SMART CHAIN

const bridge = async () => {
    if (isMetamask) {

        //CONNECT TO POLYGON AND BINANCE CONTRACT (contract parameters are coming from dotEnv)
        const signer = new ethers.Wallet(process.env.WALLET_KEY)
        const polygonContract = new ethers.Contract(process.env.POLYGON_ADDRESS, process.env.POLYGON_ABI, signer)
        const binanceContract = new ethers.Contract(process.env.BINANCE_ADDRESS, process.env.BINANCE_ABI, signer)



        //POLYGON AND BINANCE CONTRACTS HAVE PUBLIC METHODS AVAILABLE TO US NOW WHICH WERE CODED IN SOLIDITY

        //BEGIN A TRANSACTION BY RETRIEVING AMOUNT TO TRANSFER FROM FRONTEND
        const txAmount = document.getElementById("txAmount").value.ethers.BigNumber.from()

        //CHECK TO SEE IF WALLET HAS SUFFICIENT FUNDS
        const checkBalance = async () => {

            txAmount <= await signer.getBalance([]) ? true : false
        }

        //CONTRACT DECREMENTS AMOUNT IN WALLET AND "LOCKS" TOKENS IN CONTRACT -RETURNS AN EVENT THAT WILL ADD A LISTENER TO CONTRACT THAT WILL BE TRIGGERED ONCE. AFTER WHICH IT WILL BE REMOVED
        const tx1 = async () => {
            if (await checkBalance()) {
                polygonContract.escrow(txAmount)
                polygonContract.writeVerify(signer)
                polygonContract.once(burnToken, verified)
            }
            return await polygonContract.event()

        }

        const eventVerify = tx1()

        //SEND VERIFICATION TO BINANCE CONTRACT TO BEGIN TRANSACTION- BINANCE CONTRACT TAKES THE RETURNED VALUE FROM POLYGON TRANSACTION EVENT AND COMPARES IT TO ON-CHAIN LOG- IF THEY MATCH BINANCE CONTRACT CONTINUES ELSE RETURNS ERROR AND SENDS POLYGON CONTRACT ERROR TO ABORT AND REVERT STATE CHANGES
        const tx2 = async () => {
            if (await binanceContract.readVerify(eventVerify)) {
                try {
                    await binanceContract.escrow(txAmount, signer)
                    await binanceContract.once()
                    await polygonContract.release(txAmount, signer)
                    return polygonContract.resolved()

                } catch (error) {
                    await binanceContract.abort(error)
                    await polygonContract.abort(error)
                }
            }
        }

        //ONCE POLYGONCONTRACT PERFORMS RELEASE METHOD THE EVENT LISTENER IS TRIGGERED BY THE CONTRACT, THE ORIGINAL POLYGON TOKENS ARE BURNED AND POLYGON CONTRACT REVERTS TO DEFAULT STATE AND COMPLETES TRANSACTION


        //BINANCE CONTRACT NOW TAKES IN A RESOLVED PARAMETER FROM VALUE RETURNED FROM SUCCESSFUL POLYGON TRANSACTION AND RELEASES TOKENS TO WALLET
        const resolve = async () => {
            let release = await binanceContract.transaction(tx2)
            let releaseLog = await binanceContract.release(release)
            return releaseLog
        }


    }

    //REMOVES ALL LISTENERS FROM THE CONTRACTS TO PREVENT UNPLANNED EVENTS
    polygonContract.removeAllListeners()
    binanceContract.removeAllListeners()

    return

}