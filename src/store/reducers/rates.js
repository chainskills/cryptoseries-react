import * as actionTypes from '../actions/actionTypes';

const initialState = {
    ethRate: {}
};

const updateEthRate = (action, state) => {
    return {
        ethRate: {
            ...state.ethRate,
            [action.fiatSymbol]: action.rate
        }
    };
};

const reducer = (state = initialState, action) => {
    switch(action.type) {
        case actionTypes.UPDATE_ETH_RATE: return updateEthRate(action, state);
        default: return state;
    }
};

export default reducer;