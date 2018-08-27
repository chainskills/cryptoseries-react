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
        }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 500
        }
    }
};
