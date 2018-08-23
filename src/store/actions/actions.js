import * as actionTypes from './actionTypes';

export const getEthRate = (fiatSymbol) => {
    //console.log("Getting ETH rate for " + fiatSymbol);
    return {
        type: actionTypes.GET_ETH_RATE,
        fiatSymbol: fiatSymbol
    };
};

export const updateEthRate = (fiatSymbol, rate) => {
    //console.log("Updating ETH rate in " + fiatSymbol + ": " + rate);
    return {
        type: actionTypes.UPDATE_ETH_RATE,
        fiatSymbol: fiatSymbol,
        rate: rate
    };
};