module.exports = {
    networks: {
        mainnet: {
            from: '0xED3f6E6B5fFc52E37Ea6a02D78193b558EF0C428',
            host: 'localhost',
            port: 8545,
            network_id: '1',
            gasPrice: 10350000000 // 10.35 GWei
        },
        rinkeby: {
            from: '0xED3f6E6B5fFc52E37Ea6a02D78193b558EF0C428',
            host: 'localhost',
            port: 8545,
            network_id: '4',
            gasPrice: 10350000000 // 10.35 GWei
        }
    }
};
