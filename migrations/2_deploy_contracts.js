var Series = artifacts.require("Series");

module.exports = function (deployer) {
    deployer.deploy(Series, "ProofOfCast", web3.toWei(0.005, "ether"), 14 * 24 * 60 * 60 / 15,
        "Le podcast francophone qui vous explique, qui vous raconte, et qui vous démystifie les cryptomonnaies, les blockchains et les plate-formes décentralisées. ",
        "Tous les contributeurs ont accès à notre plus grande reconnaissance",
        "http://www.proofofcast.com");
};
