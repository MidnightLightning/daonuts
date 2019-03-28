import React from 'react'
import {
  AragonApp,
  AppBar,
  AppView,
  SidePanel,
  Button,
  BaseStyles,
  Main,
  Text,
  Field,
  TextInput,
  Info,
  breakpoint,
  theme,
  observe
} from '@aragon/ui'
import Aragon, { providers } from '@aragon/client'
import styled from 'styled-components'
const AppContainer = styled(AragonApp)`
  display: flex;
  align-items: center;
  justify-content: center;
`

import reg01 from '../registrations/post/0xbbdacbe4.json'
import reg02 from '../registrations/post/0xc3273767.json'
import reg03 from '../registrations/post/0x8476930a.json'

export default class App extends React.Component {

  state = {newRoot:'', claim:'', username:'', roots: [], panelOpen: false, panel: {title: "Peach"}}

  lastObservable = {}

  registrations = {
    "0xbbdacbe4": reg01,
    "0xc3273767": reg02,
    "0x8476930a": reg03
  }

  initDone = false

  componentDidUpdate = (prevProps) => {
    if(!this.initDone) {
      this.init()
    }
    if (this.props.userAccount !== prevProps.userAccount)
      this.getUsername(this.props.userAccount)
    if (this.props.observable && !prevProps.observable) {
      this.props.observable.subscribe(o=>{
        if(!o) return
        if(o.regChange !== this.lastObservable.regChange)
          this.getUsername(this.props.userAccount)
        if(o.rootsCount !== this.lastObservable.rootsCount)
          this.getRoots(o.rootsCount)
        this.lastObservable = o
      })
    }
  }

  init = async () => {
    this.getUsername(this.props.userAccount)
    let rootsCount = await this.props.app.call('getRootsCount').toPromise()
    this.getRoots(rootsCount)
    this.initDone = true
  }

  getRoots = async (length) => {
    let roots = await Promise.all(
        Array
          .from({length})
          .map((v,i)=>this.props.app.call('roots', i).toPromise())
      )

    this.setState({roots})
  }

  getUsername = async (account) => {
    console.log("getUsername")
    let username = await this.props.app.call('ownerToUsername', account).toPromise()
    if(username) this.setState({username: web3.toUtf8(username)})
  }

  handleNameCheckChange = async (event) => {
    let username = event.target.value;
    if(!username) return
    console.log(username)
    let usernameHex = web3.fromAscii(username)                // username
    console.log(usernameHex)
    let nameCheckOwner = await this.props.app.call('usernameToOwner', usernameHex).toPromise()
    console.log(nameCheckOwner)
    this.setState({nameCheckOwner})
  }

  handleMenuPanelOpen = () => {
    this.props.sendMessageToWrapper('menuPanel', true)
  }

  deregister = (event) => {
    this.props.app.deregisterSelf()
  }

  submitRoot = (event) => {
    this.props.app.addRoot(this.state.newRoot)
  }

  usePanel = (panel) => {
    this.setState({panelOpen: true, panel})
  }

  closePanel = () => {
    this.setState({panelOpen: false})
  }

  register = (root, userRegData) => {
    console.log(userRegData)
    let username = web3.fromAscii(userRegData.username)                // username

    this.props.app.registerSelf(root, username, userRegData.proof)
  }

  openRegisterControls = (root) => {
    this.usePanel({
      title: `Register in period: ${root.slice(0,7)}...`,
      child: Register,
      childProps: {
        app: this.props.app,
        root
      }
    })
  }

  openNewRegistrationPeriodControls = () => {
    this.usePanel({
      title:"New asset",
      child: NewRegistrationPeriod,
      childProps: {
        app: this.props.app
      }
    })
  }

  render () {
    const Child = this.state.panel.child
    return (
      <Main>
        <AppView appBar={<AppBar title="Registry" endContent={<Button mode="strong" onClick={this.openNewRegistrationPeriodControls}>New Registration Period</Button>} />} >
          {this.state.username ? <Welcome username={this.state.username} /> : null}
          <br />
          <p>Your account: {this.props.userAccount}</p>
          <hr />
          <br />
          <Text size="xlarge">Accepted merkle roots:</Text>
          <RootList roots={this.state.roots} register={this.register} registrations={this.registrations} userAccount={this.props.userAccount} username={this.state.username} />
          <br />
          <hr />
          <br />
          <Field label="Deregister:">
            <Button onClick={this.deregister}>Deregister!</Button>
          </Field>
          <br />
          <hr />
          <Field label="Check:">
            <TextInput placeholder="username" value={this.state.nameCheck} onChange={this.handleNameCheckChange} />
            <p>owner: {this.state.nameCheckOwner}</p>
          </Field>
          <SidePanel title={this.state.panel.title} opened={this.state.panelOpen} onClose={this.closePanel}>
            {Child && <Child {...this.state.panel.childProps} />}
          </SidePanel>
        </AppView>
      </Main>
    )
  }
}

class NewRegistrationPeriod extends React.Component {

  state = {newRoot: ''}

  handleNewRootChange = (event) => {
    this.setState({newRoot: event.target.value});
  }

  submitRoot = (event) => {
    let peach = this.props.app.addRoot(this.state.newRoot);
  }

  render() {
    return (
      <Field label="New registration merkle root:">
        <TextInput value={this.state.newRoot} onChange={this.handleNewRootChange} />
        <Button onClick={this.submitRoot}>Add</Button>
      </Field>
    )
  }
}

class Register extends React.Component {

  state = {claim: ''}

  handleClaimChange = (event) => {
    this.setState({claim: event.target.value});
  }

  register = (root) => {
    let claimArgs = this.state.claim.split("\t")
    let username = web3.fromAscii(claimArgs[0])                // username
    let proof = JSON.parse(claimArgs[1])                    // merkle proof

    this.props.app.registerSelf(root, username, proof)
  }

  render() {
    return (
      <Field label="Register:">
        <TextInput wide value={this.state.claim} onChange={this.handleClaimChange} />
        <Button onClick={()=>this.register(this.props.root)}>Register</Button>
      </Field>
    )
  }
}

function Welcome({username}) {
  return (
    <div>
      <Text.Block style={{ textAlign: 'center' }} size='large'>welcome, </Text.Block>
      <Text.Block style={{ textAlign: 'center' }} size='xxlarge'>{username}</Text.Block>
    </div>
  )
}

function RootList({roots, scope, register, registrations, userAccount, username}) {
  const listItems = roots.map((root, i) => {
    let reg = registrations[root.slice(0,10)]
    let userRegData
    if(userAccount)
      userRegData = reg.find(r=>r.address.toLowerCase()===userAccount.toLowerCase())
    return (
      <Card>
        <Content>
          <Label>
            <Text color={theme.textTertiary}>#{i} </Text>
            <span>{`${root.slice(0,10)}...`}</span>
          </Label>
          <Button disabled={!userRegData || username} mode="strong" emphasis="positive" onClick={()=>register(root, userRegData)}>Register</Button>
          {!username && userRegData && <Info.Action style={{"margin-top": "10px"}}>You can register: {userRegData.username}</Info.Action>}
          {userAccount && !userRegData && <Info.Alert style={{"margin-top": "10px"}}>{userAccount.slice(0,8)}... not found</Info.Alert>}
          {username && <Info style={{"margin-top": "10px"}}>You are registered as {username}</Info>}
        </Content>
      </Card>
    )
  });
  return (
    <Grid>{listItems}</Grid>
  );
}

// const Main = styled.div`
//   height: 100vh;
//   min-width: 320px;
// `

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 270px;
  grid-gap: 30px;

  ${breakpoint(
    'medium',
    `
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
     `,
  )};
`

const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 30px;
  background: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
`

const Content = styled.div`
  height: 100%;
`

const Label = styled.h1`
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 25px;
  height: 50px;
  margin-bottom: 10px;
`