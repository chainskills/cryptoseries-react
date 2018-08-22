import Home from './Home';
import {drizzleConnect} from 'drizzle-react';
import * as actions from '../../store/actions/actions';

// May still need this even with data function to refresh component on updates for this contract.
const mapStateToProps = state => {
    return {
        accounts: state.accounts,
        SimpleStorage: state.contracts.SimpleStorage,
        TutorialToken: state.contracts.TutorialToken,
        Series: state.contracts.Series,
        drizzleStatus: state.drizzleStatus,
        rates: state.rates.ethRate
    }
};

const mapDispatchToProps = dispatch => {
    return {
        onGetEthRate: (fiatSymbol) => {console.log(actions.getEthRate(fiatSymbol)); dispatch(actions.getEthRate(fiatSymbol));}
    };
};

const HomeContainer = drizzleConnect(Home, mapStateToProps, mapDispatchToProps);

export default HomeContainer;
