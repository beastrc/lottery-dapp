import React, { Component } from "react";

import Wrapper from "../Components/shared/Wrapper";
import LotteryContract from "../contracts/Lottery.json";
import getWeb3 from "../utils/getWeb3";
import { weiToEther } from "../utils/conversion";

import {
  Grid,
  Pagination,
  Header,
  Card,
  Statistic,
  Icon,
  Label,
  Modal,
  Button
} from "semantic-ui-react";

class History extends Component {
  _isMounted = false;

  state = {
    web3: null,
    contract: null,

    displayedGames: [], // 0 -> first ever game played
    nrOfPastGames: 0, // nrOfPastGames -1 corresponds to the index of the most recent game
    batchSize: 6, // how many games to display per 'page'
    activePage: 1,
    numberOfPages: 1
  };

  /////////////////////////////////////////////////////////////////////////////
  // initialize component state
  /////////////////////////////////////////////////////////////////////////////
  loadWeb3 = async () => {
    try {
      // get network provider and web3 instance
      const web3 = await getWeb3();

      // get the contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = LotteryContract.networks[networkId];
      const contract = new web3.eth.Contract(
        LotteryContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // set web3 and contract to the state
      if (this._isMounted) {
        this.setState({
          web3,
          contract
        });
      }

      this.loadGamesOfCurrentPage(1);
    } catch (error) {
      // catch any errors for any of the above operations
      console.error(error);
      alert(
        "Failed to load web3, accounts, or contract. Check console for details."
      );
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // fetch data
  /////////////////////////////////////////////////////////////////////////////
  fetchDataPolling = setInterval(() => {
    this.fetchData();
  }, 2000);

  fetchData = async () => {
    this.loadGamesOfCurrentPage(this.state.activePage);
  };

  loadGamesOfCurrentPage = async activePage => {
    const { contract } = this.state;

    const nrOfPastGames = await contract.methods
      .getNumberOfFinishedGames()
      .call();

    // how many items to display per page
    const batch = this.state.batchSize;

    let head = nrOfPastGames - 1 - (activePage - 1) * batch;
    let tail = head - (batch - 1);

    const thisPageHasRest = nrOfPastGames < activePage * batch;

    if (tail < 0) {
      tail = 0;
    }

    if (nrOfPastGames % batch !== 0 && thisPageHasRest) {
      tail = 0;
    }

    const displayedGames = [];
    for (head; head >= tail; head--) {
      const game = await contract.methods.finishedGames(head).call();
      displayedGames.push(game);
    }

    let numberOfPages =
      numberOfPages % batch !== 0
        ? Math.floor(nrOfPastGames / batch) + 1
        : Math.floor(nrOfPastGames / batch);

    this.setState({
      nrOfPastGames: nrOfPastGames,
      displayedGames: displayedGames,
      numberOfPages: numberOfPages
    });

    console.log(this.state.displayedGames.length);
  };

  /////////////////////////////////////////////////////////////////////////////
  // click handlers
  /////////////////////////////////////////////////////////////////////////////
  changePageClickHandler = (event, data) => {
    this.setState({ activePage: data.activePage });
    this.loadGamesOfCurrentPage(data.activePage);
  };

  /////////////////////////////////////////////////////////////////////////////
  // react life cycle hooks
  /////////////////////////////////////////////////////////////////////////////
  componentDidMount = () => {
    this._isMounted = true;
    this.loadWeb3();
  };

  componentWillUnmount = () => {
    this._isMounted = false;
    clearInterval(this.fetchDataPolling);
  };

  /////////////////////////////////////////////////////////////////////////////
  // render component
  /////////////////////////////////////////////////////////////////////////////
  render() {
    // TODO: refactor into several components, this was just quickly put together
    // to see how it looks like
    return (
      <Wrapper>
        <Grid>
          <Grid.Row>
            <Grid.Column style={{ marginTop: "1rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <Pagination
                  defaultActivePage={1}
                  firstItem={null}
                  lastItem={null}
                  pointing
                  secondary
                  totalPages={this.state.numberOfPages}
                  onPageChange={this.changePageClickHandler}
                />
              </div>
              <Card.Group itemsPerRow={3}>
                {this.state.displayedGames.map((game, index) => (
                  <Card fluid key={index}>
                    <Card.Content>
                      <Card.Header>
                        <Label
                          circular
                          style={{
                            backgroundColor: "rgb(93, 133, 164)",
                            color: "white"
                          }}
                          size="huge"
                        >
                          {game.luckyNumber}
                        </Label>
                        <Statistic floated="right" size="tiny">
                          <Statistic.Value>
                            <Icon name="ethereum" />{" "}
                            {weiToEther(game.jackpot) || "0"}
                          </Statistic.Value>
                          <Statistic.Label>Jackpot</Statistic.Label>
                        </Statistic>
                      </Card.Header>
                      <Card.Description>
                        <Grid>
                          <Grid.Row columns={2}>
                            <Grid.Column textAlign="center">
                              <Statistic size="tiny">
                                <Statistic.Value>
                                  {game.numberOfWinners || 0}{" "}
                                  <Icon name="winner" />
                                </Statistic.Value>
                                <Statistic.Label>Winners</Statistic.Label>
                              </Statistic>
                            </Grid.Column>
                            <Grid.Column textAlign="center">
                              <Statistic size="tiny">
                                <Statistic.Value>
                                  {game.numberOfParticipants || 0}{" "}
                                  <Icon name="users" />
                                </Statistic.Value>
                                <Statistic.Label>Participants</Statistic.Label>
                              </Statistic>
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row columns={2}>
                            <Grid.Column textAlign="center">
                              <Statistic size="tiny">
                                <Statistic.Value>
                                  <Icon name="square outline" /> #{" "}
                                  {game.endBlock || 0}
                                </Statistic.Value>
                                <Statistic.Label>End Block</Statistic.Label>
                              </Statistic>
                            </Grid.Column>
                            <Grid.Column textAlign="center">
                              <Statistic size="tiny">
                                <Statistic.Value>
                                  <Icon name="square outline" /> #{" "}
                                  {game.drawBlock || 0}
                                </Statistic.Value>
                                <Statistic.Label>Draw Block</Statistic.Label>
                              </Statistic>
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row>
                            <Grid.Column textAlign="center">
                              <Modal trigger={<Button>more info</Button>}>
                                <Modal.Content>
                                  <Statistic>
                                    <Statistic.Value>
                                      <Icon name="ethereum" />{" "}
                                      {weiToEther(game.jackpot) || "0"}
                                    </Statistic.Value>
                                    <Statistic.Label>Jackpot</Statistic.Label>
                                  </Statistic>
                                  <Modal.Description>
                                    <Header>Some Header Text {index}</Header>
                                    <p>
                                      Lorem ipsum dolor sit amet, consetetur
                                      sadipscing elitr, sed diam nonumy eirmod
                                      tempor invidunt ut labore et dolore magna
                                      aliquyam erat, sed diam voluptua. At vero
                                      eos et accusam et justo duo dolores et ea
                                      rebum. Stet clita kasd gubergren, no sea
                                      takimata sanctus est Lorem ipsum dolor sit
                                      amet.
                                    </p>
                                  </Modal.Description>
                                </Modal.Content>
                              </Modal>
                            </Grid.Column>
                          </Grid.Row>
                        </Grid>
                      </Card.Description>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Group>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Wrapper>
    );
  }
}

export default History;
