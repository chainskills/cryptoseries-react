import {all, fork, takeEvery} from 'redux-saga/effects'
import {drizzleSagas} from 'drizzle'
import {getEthRateSaga} from "./store/sagas/sagas";
import * as actionTypes from "./store/actions/actionTypes";

export default function* root() {
    yield all(
        drizzleSagas.map(saga => fork(saga)),
        takeEvery(actionTypes.GET_ETH_RATE, getEthRateSaga)
    );
}