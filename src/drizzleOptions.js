import Series from './../build/contracts/Series.json'

const drizzleOptions = {
    web3: {
        block: false,
        fallback: {
            type: 'ws',
            url: 'ws://127.0.0.1:8545'
        }
    },
    contracts: [
        Series
    ],
    events: {
        Series: ['NewPledger', 'NewPledge', 'NewPublication', 'Withdrawal', 'PledgeInsufficient', 'SeriesClosed']
    },
    polls: {
        accounts: 1500
    }
};

export default drizzleOptions;