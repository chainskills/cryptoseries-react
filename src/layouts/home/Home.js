import React, {Component} from 'react';
import {ContractData} from 'drizzle-react-components';
import PropTypes from 'prop-types';

class Home extends Component {
    state = {
        nextEpisodePayFiat: null
    };

    constructor(props, context) {
        super(props);

        this.web3 = context.drizzle.web3;

        this.contracts = context.drizzle.contracts;
        this.seriesContract = this.contracts.Series;

        this.publicationPeriodKey = this.seriesContract.methods.minimumPublicationPeriod.cacheCall();
        this.pledgePerEpisodeKey = this.seriesContract.methods.pledgePerEpisode.cacheCall();
        this.activePledgersKey = this.seriesContract.methods.activePledgers.cacheCall();
        this.totalPledgersKey = this.seriesContract.methods.totalPledgers.cacheCall();
        this.nextEpisodePayKey = this.seriesContract.methods.nextEpisodePay.cacheCall();
        this.yourPledgeKey = this.seriesContract.methods.pledges.cacheCall(this.props.accounts[0]);
        this.ownerKey = this.seriesContract.methods.owner.cacheCall();
        this.numberOfBlocksToWaitKey = this.seriesContract.methods.numberOfBlocksToWaitBeforeNextPublish.cacheCall();
    }

    componentDidMount() {
        this.props.onGetEthRate('EUR');
    };

    render() {
        const seriesState = this.props.Series;
        const loading = <span>Loading...</span>;

        let buttons = loading;
        let isOwner = false;
        let withdrawable = false;
        if (this.ownerKey in seriesState.owner) {
            const owner = seriesState.owner[this.ownerKey].value;
            if (owner === this.props.accounts[0]) {
                isOwner = true;
            } else {
                isOwner = false;
            }
        }

        let minimumPublicationPeriod = loading;
        if (this.publicationPeriodKey in seriesState.minimumPublicationPeriod) {
            const blocks = seriesState.minimumPublicationPeriod[this.publicationPeriodKey].value;
            minimumPublicationPeriod = blocks + " blocks (~" + (blocks * 15 / 3600 / 24) + " days)";
        }

        let pledgePerEpisode = loading;
        if (this.pledgePerEpisodeKey in seriesState.pledgePerEpisode) {
            const pledge = seriesState.pledgePerEpisode[this.pledgePerEpisodeKey].value;
            const pledgePerEpisodeEth = this.web3.utils.fromWei(pledge, "ether");
            pledgePerEpisode = pledgePerEpisodeEth + " ETH";
            if (this.props.rates && this.props.rates['EUR']) {
                pledgePerEpisode = pledgePerEpisode + ' (~' + (this.props.rates['EUR'] * pledgePerEpisodeEth).toFixed(2) + '€)';
            }
        }

        let activePledgers = loading;
        if (this.activePledgersKey in seriesState.activePledgers) {
            activePledgers = seriesState.activePledgers[this.activePledgersKey].value;
        }

        let totalPledgers = loading;
        if (this.totalPledgersKey in seriesState.totalPledgers) {
            totalPledgers = seriesState.totalPledgers[this.totalPledgersKey].value;
        }

        let nextEpisodePay = loading;
        if (this.nextEpisodePayKey in seriesState.nextEpisodePay) {
            const nextEpisodePayWei = seriesState.nextEpisodePay[this.nextEpisodePayKey].value;
            const nextEpisodePayEth = this.web3.utils.fromWei(nextEpisodePayWei, "ether");
            nextEpisodePay = nextEpisodePayEth + " ETH";
            if (this.props.rates && this.props.rates['EUR']) {
                nextEpisodePay = nextEpisodePay + ' (~' + (this.props.rates['EUR'] * nextEpisodePayEth).toFixed(2) + '€)';
            }
        }

        let yourPledge = loading;
        let numberOfEpisodes = loading;
        if (!isOwner && this.yourPledgeKey in seriesState.pledges) {
            const yourPledgeWei = seriesState.pledges[this.yourPledgeKey].value;
            if (yourPledgeWei > 0) {
                withdrawable = true;
            }
            const yourPledgeEth = this.web3.utils.fromWei(yourPledgeWei, "ether");
            yourPledge = yourPledgeEth + " ETH";
            if (this.props.rates && this.props.rates['EUR']) {
                yourPledge = yourPledge + ' (~' + (this.props.rates['EUR'] * yourPledgeEth).toFixed(2) + '€)';
            }

            if (this.pledgePerEpisodeKey in seriesState.pledgePerEpisode) {
                const pledgePerEpisodeWei = seriesState.pledgePerEpisode[this.pledgePerEpisodeKey].value;
                numberOfEpisodes = Math.ceil(yourPledgeWei / pledgePerEpisodeWei);
                if (numberOfEpisodes === 0) {
                    numberOfEpisodes = (
                        <span>
                        {numberOfEpisodes}
                            <br/>(you should pledge again if you want to support more episodes)
                        </span>
                    );
                }
            }
        }

        let yourSupport = null;
        if (!isOwner) {
            yourSupport = (
                <div>
                    <h2>Your support</h2>
                    <p><strong>Your pledge</strong>: {yourPledge}</p>
                    <p><strong>Number of episodes</strong>: {numberOfEpisodes}</p>
                </div>
            );
        }

        let publishable = false;
        let numberOfBlocksToWait = loading;
        if(this.numberOfBlocksToWaitKey in seriesState.numberOfBlocksToWaitBeforeNextPublish) {
            numberOfBlocksToWait = seriesState.numberOfBlocksToWaitBeforeNextPublish[this.numberOfBlocksToWaitKey].value;
            publishable = numberOfBlocksToWait == 0;
        }

        if (isOwner) {
            buttons = (
                <span>
                    <button>Close</button>
                    &nbsp;
                    <button disabled={!publishable}>Publish</button>
                    {!publishable ? "You have to wait for " + numberOfBlocksToWait + " blocks before you can publish again." : null}
                </span>
            );
        } else {
            buttons = (
                <span>
                    <button disabled={!withdrawable}>Withdraw</button>
                    &nbsp;
                    <button>Pledge</button>
                </span>
            )
        }

        return (
            <main className="container">
                <div className="pure-g">

                    <div className="pure-u-1-1">
                        <h1><ContractData contract="Series" method="title"/></h1>
                        <h2>Show info</h2>
                        <p><strong>Minimum publication period</strong>: {minimumPublicationPeriod}</p>
                        <p><strong>Pledge per episode</strong>: {pledgePerEpisode}</p>
                        <h2>Supporters</h2>
                        <p><strong>Active supporters</strong>: {activePledgers}</p>
                        <p><strong>Followers</strong>: {totalPledgers}</p>
                        <p><strong>Next episode pay</strong>: {nextEpisodePay}</p>
                        {yourSupport}
                        <p>{buttons}</p>

                        {/*<p>Here we have a form with custom, friendly labels. Also note the token symbol will not display
                            a loading indicator. We've suppressed it with the <code>hideIndicator</code> prop because we
                            know this variable is constant.</p>
                        <p><strong>Total Supply</strong>: <ContractData contract="TutorialToken" method="totalSupply"
                                                                        methodArgs={[{from: this.props.accounts[0]}]}/>
                            <ContractData contract="TutorialToken" method="symbol" hideIndicator/></p>
                        <p><strong>My Balance</strong>: <ContractData contract="TutorialToken" method="balanceOf"
                                                                      methodArgs={[this.props.accounts[0]]}/></p>
                        <h3>Send Tokens</h3>
                        <ContractForm contract="TutorialToken" method="transfer"
                                      labels={['To Address', 'Amount to Send']}/>

                        <br/><br/>*/}
                    </div>

                    {/*<div className="pure-u-1-1">
                        <h2>ComplexStorage</h2>
                        <p>Finally this contract shows data types with additional considerations. Note in the code the
                            strings below are converted from bytes to UTF-8 strings and the device data struct is
                            iterated as a list.</p>
                        <p><strong>String 1</strong>: <ContractData contract="ComplexStorage" method="string1" toUtf8/>
                        </p>
                        <p><strong>String 2</strong>: <ContractData contract="ComplexStorage" method="string2" toUtf8/>
                        </p>
                        <strong>Single Device Data</strong>: <ContractData contract="ComplexStorage" method="singleDD"/>

                        <br/><br/>
                    </div>*/}
                </div>
            </main>
        )
    }
}

Home.contextTypes = {drizzle: PropTypes.object};

export default Home
