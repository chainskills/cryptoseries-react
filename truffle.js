var HDWalletProvider = require("truffle-hdwallet-provider");
var rinkebyMnemonic = "coach hungry nice obey injury bid uncover water carbon milk foam drift";

module.exports = {
    migrations_directory: "./migrations",
    networks: {
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*" // Match any network id
        },
        private: {
            host: "localhost",
            port: 8545,
            network_id: 4224
        },
        rinkeby: {
            host: "localhost",
            port: 8545,
            network_id: 4
        },
        rinkebyremote: {
            provider: function() {
                return new HDWalletProvider(rinkebyMnemonic, "https://rinkeby.infura.io/v3/e2f6f35b6c854c21b6291832f8057746")
            },
            network_id: 4
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 500
        }
    }
};
