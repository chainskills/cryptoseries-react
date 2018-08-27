import React, {Component, Fragment} from 'react';
import {ContractData} from 'drizzle-react-components';
import PropTypes from 'prop-types';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Modal from '@material-ui/core/Modal';
import './Home.css';

class Home extends Component {
    state = {
        nextEpisodePayFiat: null,
        pledgeAmount: null,
        episodeLink: '',
        withdrawRequested: false,
        closeRequested: false
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

    onPledgeAmountChanged = (event) => {
        this.setState({
            pledgeAmount: event.target.value
        });
    };

    onPledgeButtonClicked = () => {
        const pledgeAmountInEth = this.state.pledgeAmount;
        const pledgeAmountInWei = this.web3.utils.toWei("" + pledgeAmountInEth, "ether");
        this.pledgeId = this.contracts.Series.methods.pledge.cacheSend({value: pledgeAmountInWei, gas: 500000});
    };

    onWithdrawButtonClicked = () => {
        this.setState({withdrawRequested: true});
    };

    onCloseButtonClicked = () => {
        this.setState({closeRequested: true});
    };

    onEpisodeLinkChanged = (event) => {
        this.setState({episodeLink: event.target.value});
    };

    onPublishButtonClicked = () => {
        const episodeLink = this.state.episodeLink;
        this.publishId = this.contracts.Series.methods.publish.cacheSend(episodeLink, {gas: 500000});
    };

    onCancelWithdraw = () => {
        this.setState({withdrawRequested: false});
    };

    onConfirmWithdraw = () => {
        this.withdrawId = this.contracts.Series.methods.withdraw.cacheSend({gas: 500000});
        this.setState({withdrawRequested: false});
    };

    onCancelClose = () => {
        this.setState({closeRequested: false});
    };

    onConfirmClose = () => {
        this.closeId = this.contracts.Series.methods.close.cacheSend({gas: 500000});
        this.setState({closeRequested: false});
    };

    render() {
        const seriesState = this.props.Series;
        const loading = <CircularProgress/>;

        if (this.props.transactionStack && this.props.transactionStack[this.closeId]) {
            const txHash = this.props.transactionStack[this.closeId];
            const closeStatus = this.props.transactions[txHash].status;
            if (closeStatus === 'success') {
                window.location.reload(true);
            }
        }

        let buttons = loading;
        let isOwner = false;
        let withdrawable = false;
        let closed = false;
        if (this.ownerKey in seriesState.owner) {
            const owner = seriesState.owner[this.ownerKey].value;
            isOwner = owner === this.props.accounts[0];
            if (owner === undefined) {
                closed = true;
            }
        }

        let content = null;
        if (!closed) {
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
                } else {
                    nextEpisodePay = <Fragment>{nextEpisodePay} <CircularProgress size={20}/></Fragment>
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
                } else {
                    yourPledge = <Fragment>{yourPledge} <CircularProgress size={20}/></Fragment>
                }

                if (this.pledgePerEpisodeKey in seriesState.pledgePerEpisode) {
                    const pledgePerEpisodeWei = seriesState.pledgePerEpisode[this.pledgePerEpisodeKey].value;
                    numberOfEpisodes = Math.ceil(yourPledgeWei / pledgePerEpisodeWei);
                    if (numberOfEpisodes === 0) {
                        numberOfEpisodes = (
                            <Fragment>
                                None
                                <Typography variant="caption">
                                    (you should pledge again if you want to support more episodes)
                                </Typography>
                            </Fragment>
                        );
                    }
                }
            }

            let yourSupport = null;
            if (!isOwner) {
                yourSupport = (
                    <div>
                        <Typography variant="headline" component="h3" gutterBottom>Your support</Typography>
                        <Typography paragraph><strong>Your pledge</strong>: {yourPledge}</Typography>
                        <Typography paragraph><strong>Number of episodes</strong>: {numberOfEpisodes}</Typography>
                    </div>
                );
            }

            let publishable = false;
            let numberOfBlocksToWait = loading;
            if (this.numberOfBlocksToWaitKey in seriesState.numberOfBlocksToWaitBeforeNextPublish) {
                numberOfBlocksToWait = seriesState.numberOfBlocksToWaitBeforeNextPublish[this.numberOfBlocksToWaitKey].value;
                publishable = +numberOfBlocksToWait === 0;
            }

            if (isOwner) {
                let publishStatus = null;
                if (this.props.transactionStack && this.props.transactionStack[this.publishId]) {
                    const txHash = this.props.transactionStack[this.publishId];
                    publishStatus = <Typography variant="caption">{this.props.transactions[txHash].status}</Typography>;
                }
                buttons = (
                    <CardActions>
                        <Button color="secondary" size="small" onClick={this.onCloseButtonClicked}>Close</Button>
                        <TextField value={this.state.episodeLink}
                                   placeholder="Episode link"
                                   className="textField"
                                   onChange={this.onEpisodeLinkChanged}/>
                        <Button color="primary" size="small" disabled={!publishable}
                                onClick={this.onPublishButtonClicked}>Publish</Button>
                        {!publishable ?
                            <Typography variant="caption">You have to wait for {numberOfBlocksToWait} blocks before you
                                can publish again.</Typography> : null}
                        <br/>
                        {publishStatus}
                    </CardActions>
                );
            } else {
                let pledgeStatus = null;
                if (this.props.transactionStack && this.props.transactionStack[this.pledgeId]) {
                    const txHash = this.props.transactionStack[this.pledgeId];
                    pledgeStatus = this.props.transactions[txHash].status;
                }
                buttons = (
                    <CardActions>
                        <Button color="secondary" disabled={!withdrawable}
                                onClick={this.onWithdrawButtonClicked}>Withdraw</Button>
                        &nbsp;
                        <TextField name="pledgeAmount" className="amountField textField"
                                   placeholder="Amount to pledge in ETH"
                                   onChange={this.onPledgeAmountChanged}
                                   value={this.state.pledgeAmount}/>
                        <Button color="primary" onClick={this.onPledgeButtonClicked}>Pledge</Button>
                        <Typography variant="caption">{pledgeStatus}</Typography>
                    </CardActions>
                )
            }

            content = (
                <Card className="mainCard">
                    <CardContent>
                        <Typography variant="display1" component="h2" gutterBottom>
                            <ContractData contract="Series" method="title"/>
                        </Typography>
                        <Typography variant="headline" component="h3" gutterBottom>Show info</Typography>
                        <Typography paragraph><strong>Minimum publication period</strong>: {minimumPublicationPeriod}
                        </Typography>
                        <Typography paragraph><strong>Pledge per episode</strong>: {pledgePerEpisode}</Typography>
                        <Typography variant="headline" component="h3" gutterBottom>Supporters</Typography>
                        <Typography paragraph><strong>Active supporters</strong>: {activePledgers}</Typography>
                        <Typography paragraph><strong>Followers</strong>: {totalPledgers}</Typography>
                        <Typography paragraph><strong>Next episode pay</strong>: {nextEpisodePay}</Typography>
                        {yourSupport}
                    </CardContent>
                    {buttons}
                </Card>
            );
        } else {
            content = (
                <Card className="mainCard">
                    <CardContent>
                        <Typography variant="display2">This show has been cancelled. You cannot support it
                            anymore.</Typography>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Fragment>
                <Grid container spacing={16}
                      direction="row"
                      justify="center"
                      alignItems="center">
                    <Grid item xs={6}>
                        {content}
                    </Grid>
                </Grid>
                <Modal
                    aria-labelledby="withdraw-modal-title"
                    aria-describedby="withdraw-modal-description"
                    open={this.state.withdrawRequested}
                    onClose={this.onCancelWithdraw}>
                    <div className="modal">
                        <Typography variant="title" id="withdraw-modal-title">
                            Are you sure you want to withdraw your pledge?
                        </Typography>
                        <Typography variant="subheading" id="withdraw-modal-description">
                            <p>If you withdraw your pledge, you will get all of it back (minus the fees for this
                                transaction of course), but you will no longer support new episodes of this show.</p>
                            <p>Are you sure you want to withdraw?</p>
                        </Typography>
                        <div className="buttonBar">
                            <Button variant="raised" color="secondary"
                                                           onClick={this.onCancelWithdraw}>Cancel</Button>
                            &nbsp;
                            <Button variant="raised" color="primary" onClick={this.onConfirmWithdraw}>Give me my money
                                back</Button>
                        </div>
                    </div>
                </Modal>
                <Modal
                    aria-labelledby="close-modal-title"
                    aria-describedby="close-modal-description"
                    open={this.state.closeRequested}
                    onClose={this.onCancelClose}>
                    <div className="modal">
                        <Typography variant="title" id="close-modal-title">
                            Are you sure you want to close this show?
                        </Typography>
                        <Typography variant="subheading" id="withdraw-modal-description" component="p">
                            If you close this show, all the pledges will be sent back to your pledgers and this contract will be disabled, making it impossible for people to contribute to it again.
                        </Typography>
                        <div className="buttonBar">
                            <Button variant="raised" color="secondary"
                                    onClick={this.onCancelClose}>Cancel</Button>
                            &nbsp;
                            <Button variant="raised" color="primary" onClick={this.onConfirmClose}>Close the show</Button>
                        </div>
                    </div>
                </Modal>
            </Fragment>
        )
    }
}

Home.contextTypes = {drizzle: PropTypes.object};

export default Home
