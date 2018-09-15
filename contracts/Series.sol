pragma solidity ^0.4.22;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract Series is Ownable {
    using SafeMath for uint;

    //title of the series
    string public title;
    //description of the series
    string public description;
    //perks for contributors
    string public perks;
    //link to access the series
    string public link;
    //amount that the owner will receive from each pledger for each episode
    uint public pledgePerEpisode;
    //periodicity of episodes, in number of blocks
    //to limit the possibility of owner to drain pledgers' accounts by publishing multiple episodes quickly
    uint public minimumPublicationPeriod;

    //to keep track of how much each publisher pledged, knowing that this pledge will decrease each time a new episode is published, or when a pledger withdraws everything from his account
    mapping(address => uint) public pledges;
    //to keep a list of all the pledgers into the series
    address[] pledgers;
    //to keep track of the last time an episode was published, and limit the frequency of publications
    uint public lastPublicationBlock;
    //to keep track of all published episodes
    mapping(uint => string) public publishedEpisodes;
    uint public episodeCounter;

    //events
    /*
    * Emitted when a new pledger joins the series
    * @param pledger Address of the new pledger
    */
    event NewPledger(address pledger);
    /*
    * Emitted when a pledger pledges some amount, whether he is a new pledger or a previous one just topping up his account
    * @param pledger Address of the pledger
    * @param pledge Amount pledged this time
    * @param totalPledge Balance of this pledger's account including what he just pledged
    */
    event NewPledge(address indexed pledger, uint pledge, uint totalPledge);
    /*
    * Emitted when the owner published a new episode
    * @param episodeHash Hash of the published episode
    * @param episodePay How much the owner received for this episode
    */
    event NewPublication(uint episodeId, string episodeLink, uint episodePay);
    /*
    * Emitted when a pledger withdraws all his pledge from his account
    * @param pledger Address of the withdrawing pledger
    * @param pledge Amount that was sent back to the pledger
    */
    event Withdrawal(address indexed pledger, uint pledge);
    /*
    * Emitted when a pledge goes lower than pledgePerEpisode, that can be used to notify the pledger that he should top up his account before next episode is published
    * @param pledger Address of the pledger
    * @param pledge Current balance of the pledger
    */
    event PledgeInsufficient(address indexed pledger, uint pledge);
    /*
    * Emitted when the show is closed by the owner
    * @param balanceBeforeClose Balance of the contract at the moment of closing
    */
    event SeriesClosed(uint balanceBeforeClose);
    /*
    * Emitted when the owner modifies the perks, to give contributors a chance to review the changes and react accordingly
    * @param oldPerks Perks as they were before the change
    * @param newPerks Perks as they are after the change
    */
    event PerksChanged(string oldPerks, string newPerks);
    /*
    * Emitted when the owner modifies the link of the series, to give contributors a chance to review the changes and react accordingly
    * @param oldLink Link as it was before the change
    * @param newLink Link as it is after the change
    */
    event LinkChanged(string oldLink, string newLink);

    /*
    * Configures the series parameters
    * @param _title Title of the series
    * @param _pledgePerEpisode Amount the owner will receive for each episode from each pledger
    * @param _minimumPublicationPeriod Number of blocks the owner will have to wait between 2 publications
    * @param _description Description of the show
    * @param _perks Benefits contributors get in exchange for their contribution
    * @param _link General link to access the show
    */
    constructor(string _title, uint _pledgePerEpisode, uint _minimumPublicationPeriod, string _description, string _perks, string _link) public {
        title = _title;
        pledgePerEpisode = _pledgePerEpisode;
        minimumPublicationPeriod = _minimumPublicationPeriod;
        description = _description;
        perks = _perks;
        link = _link;
    }

    /**
    * TRANSACTIONAL FUNCTIONS
    */

    /*
    * Lets someone increase their pledge.
    * The first time you pledge, you must pledge at least the minimum pledge per episode.
    * Then for every new pledge, the amount you already pledged plus the new amount must be at least the minimum pledge per episode
    * This function is payable so the pledge must be transmitted with msg.value
    * The owner cannot pledge on its own series.
    */
    function pledge() public payable {
        require(msg.value.add(pledges[msg.sender]) >= pledgePerEpisode, "Pledge must be greater than minimum pledge per episode");
        require(msg.sender != owner, "Owner cannot pledge on its own series");
        bool oldPledger = false;
        for (uint i = 0; i < pledgers.length; i++) {
            if (pledgers[i] == msg.sender) {
                oldPledger = true;
                break;
            }
        }
        if (!oldPledger) {
            pledgers.push(msg.sender);
            emit NewPledger(msg.sender);
        }
        pledges[msg.sender] = pledges[msg.sender].add(msg.value);
        emit NewPledge(msg.sender, msg.value, pledges[msg.sender]);
    }

    /*
    * This function can only be called by the owner.
    * And it can only be called if at least minimumPublicationPeriod blocks have passed since lastPublicationBlock
    * If those prerequisites are met, then the owner receives pledgePerEpisode times number of pledgers whose pledge is still greater than pledgePerEpisode
    * @param episodeLink Link to download the episode
    */
    function publish(string episodeLink) public onlyOwner {
        require(lastPublicationBlock == 0 || block.number > lastPublicationBlock.add(minimumPublicationPeriod), "Owner cannot publish again so soon");

        lastPublicationBlock = block.number;
        episodeCounter++;
        publishedEpisodes[episodeCounter] = episodeLink;

        //update pledges
        uint episodePay = 0;
        for (uint i = 0; i < pledgers.length; i++) {
            if (isActive(pledgers[i])) {
                pledges[pledgers[i]] = pledges[pledgers[i]].sub(pledgePerEpisode);
                episodePay = episodePay.add(pledgePerEpisode);
                if (!isActive(pledgers[i])) {
                    emit PledgeInsufficient(pledgers[i], pledges[pledgers[i]]);
                }
            }
        }

        //pay the owner
        owner.transfer(episodePay);
        emit NewPublication(episodeCounter, episodeLink, episodePay);
    }

    /*
    * Let a pledger withdraw his entire pledge from his account
    */
    function withdraw() public {
        uint amount = pledges[msg.sender];
        if (amount > 0) {
            pledges[msg.sender] = 0;
            msg.sender.transfer(amount);
            emit Withdrawal(msg.sender, amount);
            emit PledgeInsufficient(msg.sender, 0);
        }
    }

    /*
    * Give their money back to all pledgers before killing the contract
    */
    function close() public onlyOwner {
        uint contractBalance = address(this).balance;
        for (uint i = 0; i < pledgers.length; i++) {
            uint amount = pledges[pledgers[i]];
            if (amount > 0) {
                pledgers[i].transfer(amount);
            }
        }
        emit SeriesClosed(contractBalance);
        selfdestruct(owner);
    }

    /**
    * VIEW FUNCTIONS
    */

    /*
    * Total number of pledgers, whether they are still active or not,
    * that is the number of accounts that have pledged at some point
    */
    function totalPledgers() public view returns (uint) {
        return pledgers.length;
    }

    /*
    * Number of active pledgers, that is number of pledgers whose pledge is still
    * greater than minimum pledge per episode
    */
    function activePledgers() public view returns (uint) {
        uint active = 0;
        for (uint i = 0; i < pledgers.length; i++) {
            if (isActive(pledgers[i])) {
                active++;
            }
        }
        return active;
    }

    /*
    * Calculate how much the owner will get paid for next episode
    */
    function nextEpisodePay() public view returns (uint) {
        uint episodePay = 0;
        for (uint i = 0; i < pledgers.length; i++) {
            if (isActive(pledgers[i])) {
                episodePay = episodePay.add(pledgePerEpisode);
            }
        }

        return episodePay;
    }

    function isActive(address pledger) internal view returns (bool) {
        return pledges[pledger] >= pledgePerEpisode;
    }

    function numberOfBlocksToWaitBeforeNextPublish() public view returns (uint) {
        if(lastPublicationBlock == 0 || block.number >= lastPublicationBlock + minimumPublicationPeriod) {
            return 0;
        } else {
            return lastPublicationBlock + minimumPublicationPeriod - block.number;
        }
    }

    /*
    * Lets the owner update the perks of the show, which explains what contributors get
    * @param _perks New message explaining what contributors get
    */
    function setPerks(string _perks) public onlyOwner {
        require(bytes(_perks).length > 0, "Perks cannot be empty");
        string memory oldPerks = perks;
        perks = _perks;
        emit PerksChanged(oldPerks, _perks);
    }

    /*
    * Lets the owner update the general link of the show
    * @param _link New general link for the show
    */
    function setLink(string _link) public onlyOwner {
        require(bytes(_link).length > 0, "Link must be specified");
        string memory oldLink = link;
        link = _link;
        emit LinkChanged(oldLink, _link);
    }
}
