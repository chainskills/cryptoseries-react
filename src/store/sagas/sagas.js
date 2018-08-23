import axios from "axios/index";
import {put} from 'redux-saga/effects';
import * as actions from '../actions/actions';

const http = axios.create({
    baseURL: 'https://min-api.cryptocompare.com/data'
});

export function* getEthRateSaga(action) {
    //console.log("Fetching ETH rate for " + action.fiatSymbol);
    try {
        const response = yield http.get('/price?fsym=ETH&tsyms=' + action.fiatSymbol);
        const rate = response.data[action.fiatSymbol];
        //console.log(rate);
        yield put(actions.updateEthRate(action.fiatSymbol, rate));
    } catch(error) {
        console.error(error);
    }
}