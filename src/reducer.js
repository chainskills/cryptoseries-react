import {combineReducers} from 'redux'
import {routerReducer} from 'react-router-redux'
import {drizzleReducers} from 'drizzle'
import ratesReducer from './store/reducers/rates';

const reducer = combineReducers({
    routing: routerReducer,
    rates: ratesReducer,
    ...drizzleReducers
});

export default reducer;
