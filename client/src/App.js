import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";

import Wrapper from "./Components/Wrapper";
import Loading from "./Components/Loading";
import SiteHeader from "./Components/SiteHeader";

import UserInformation from "./Components/UserInformation";
import ContractInteraction from "./Components/ContractInteraction";

import Lottery from "./Components/Lottery/Lottery";

import { Grid } from "semantic-ui-react";

import "semantic-ui-css/semantic.min.css";

import "./App.css";

class App extends Component {
  state = {
    storageValueWei: 0,
    web3: null,
    accounts: null,
    contract: null,
    activeAccount: null,
    activeAccountBalance: -1
  };

  etherToWei = value => {
    return value * 1000000000000000000;
  };

  weiToEther = value => {
    return Math.round((value / 1000000000000000000) * 100) / 100;
  };

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
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState(
        {
          web3,
          accounts,
          contract: instance,
          activeAccount,
          activeAccountBalance
        },
        this.init
      );
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        "Failed to load web3, accounts, or contract. Check console for details."
      );
      console.error(error);
    }

    // check every second whether the account was changed in metamask or not
    setInterval(() => {
      this.checkForAccountChange();
    }, 1000);
  };

  checkForAccountChange = async () => {
    const { web3, accounts, activeAccount, activeAccountBalance } = this.state;

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

  init = async () => {
    const { contract } = this.state;

    // get the account balance from of the smart contract
    const response = await contract.methods.getContractBalance().call();

    // update state with the result
    this.setState({ storageValueWei: response });
  };

  sendMoney = async () => {
    const { accounts, contract } = this.state;

    // send a given value of wei to the smart contract
    const value = this.etherToWei(1);
    await contract.methods.sendWei().send({ from: accounts[0], value: value });

    // update state with stored value of wei
    this.setState({
      storageValueWei: await contract.methods.getContractBalance().call()
    });
  };

  getMoneyBack = async () => {
    const { accounts, contract } = this.state;

    // get the whole account balance of the smart contract
    await contract.methods.getBack().send({ from: accounts[0] });

    // update state with stored value of wei
    this.setState({
      storageValueWei: await contract.methods.getContractBalance().call()
    });
  };

  render() {
    return (
      <div>
        <SiteHeader />
        <Wrapper>
          <Grid>
            <Grid.Row>
              <Grid.Column>
                <Lottery />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                {this.state.web3 ? (
                  <div>
                    <UserInformation
                      accountNr={this.state.activeAccount}
                      accountBalance={this.weiToEther(
                        this.state.activeAccountBalance
                      )}
                      vaultBalance={this.weiToEther(this.state.storageValueWei)}
                    />
                    <ContractInteraction
                      sendMoneyToVault={this.sendMoney}
                      getMoneyFromVault={this.getMoneyBack}
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
