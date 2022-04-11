import React, { Component } from "react";
import LotteryMockContract from "./contracts/LotteryMock.json";
import getWeb3 from "./utils/getWeb3";

import Wrapper from "./Components/shared/Wrapper";
import Loading from "./Components/shared/Loading";
import SiteHeader from "./Components/shared/SiteHeader";

import Dashboard from "./Components/Dashboard/Dashboard";
import Tickets from "./Components/Tickets/Tickets";
import Game from "./Components/Game/Game";

import { Grid, Segment } from "semantic-ui-react";

import "semantic-ui-css/semantic.min.css";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    activeAccount: null,
    activeAccountBalance: -1,
    tickets: null,
    jackpot: null
  };

  etherToWei = value => value * 1000000000000000000;
  weiToEther = value => Math.round((value / 1000000000000000000) * 100) / 100;

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the currently active account and its balance
      const activeAccount = accounts[0];
      const activeAccountBalance = await web3.eth.getBalance(activeAccount);

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = LotteryMockContract.networks[networkId];
      const instance = new web3.eth.Contract(
        LotteryMockContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        web3,
        accounts,
        contract: instance,
        activeAccount,
        activeAccountBalance
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
      alert(
        "Failed to load web3, accounts, or contract. Check console for details."
      );
    }

    // check for changes of the data in the blockhain
    setInterval(() => {
      this.checkForChanges();
    }, 2000);
  };

  buyTicketClickHandler = async number => {
    const { contract, accounts } = this.state;
    if (this.isNumber(number) && this.isValid(number)) {
      await contract.methods
        .buyTicket(number)
        .send({ from: accounts[0], value: this.etherToWei(1) });
      this.updateTickets();
    } else {
      alert("Must be a number between 1 and 5!");
    }
  };

  endGameClickHandler = async () => {
    const { contract, accounts } = this.state;
    await contract.methods
      .endGame()
      .send({ from: accounts[0] });
  };

  updateTickets = async () => {
    const { contract } = this.state;
    const tickets = await contract.methods.getMyTickets().call();
    this.setState({ tickets: tickets });
  };

  updateJackpot = async () => {
    const { contract } = this.state;
    const jackpot = await contract.methods.getJackpot().call();
    this.setState({ jackpot: this.weiToEther(jackpot) });
  }

  checkForChanges = async () => {
    const { web3, accounts, activeAccount, activeAccountBalance } = this.state;

    this.updateTickets();
    this.updateJackpot();

    const newAccounts = await web3.eth.getAccounts();
    if (accounts !== newAccounts) {
      this.setState({ accounts: newAccounts });
    }

    const newActiveAccount = newAccounts[0];
    if (activeAccount !== newActiveAccount) {
      this.setState({ activeAccount: newActiveAccount });
    }

    const newActiveAccountBalance = await web3.eth.getBalance(newActiveAccount);
    if (activeAccountBalance !== newActiveAccountBalance) {
      this.setState({ activeAccountBalance: newActiveAccountBalance });
    }
  };

  isNumber = inputToCheck => {
    return !isNaN(inputToCheck);
  };

  isValid = inputToCheck => {
    if (!this.isNumber(inputToCheck)) {
      return false;
    }
    return inputToCheck > 0 && inputToCheck < 6;
  };

  render() {
    return (
      <div>
        <SiteHeader />
        <Wrapper>
          <Grid>
          <Grid.Row>
              <Grid.Column width={8}>
              <div style={{ textAlign: "center", margin: "1rem" }}>
            <Segment>
              <strong>Account: </strong>
              {this.state.activeAccount}
            </Segment>
          </div>
              </Grid.Column> 
              <Grid.Column width={8}>
              <div style={{ textAlign: "center", margin: "1rem" }}>
            <Segment>              
              Your account has <strong>{this.weiToEther(this.state.activeAccountBalance)}</strong>  ETH 
            </Segment>
          </div>
                </Grid.Column> 
              </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                {this.state.web3 ? (
                  <div>
                    <Dashboard 
                    jackpot={this.state.jackpot}
                    />
                    <Game
                      buyTicket={this.buyTicketClickHandler}
                      endGame={this.endGameClickHandler}
                    />
                    <Tickets
                      tickets={this.state.tickets}
                    />
                  </div>
                ) : (
                  <Loading
                    message={"Loading Web3, accounts, and contract..."}
                  />
                )}
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Wrapper>
      </div>
    );
  }
}

export default App;
