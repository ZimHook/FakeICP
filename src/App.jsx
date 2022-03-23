import React, { useState, useEffect } from "react";
import { fromHexString, principalToAccountAddressArray, to32bits} from './utils.jsx';
import {idlFactory as ledgerIDL} from './candid/ledger.did.js';
import { idlFactory as blockIDL } from "./candid/block.did.js";
import { Actor, HttpAgent } from "@dfinity/agent";
import { Button, Input, message } from "antd";
import "./App.css"

const App = () => {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState(null);
  const [block, setBlock] = useState(null);
  const [principal, setPrincipal] = useState("")
  const [queryLoading, setQueryLoading] = useState(false)
  const [mintLoading, setMintLoading] = useState(false)
  
  useEffect(async () => {
    let anonymousAgent = new HttpAgent({ ...{ host: 'https://boundary.ic0.app' } });
    if (process.env.NODE_ENV !== 'production') {
      await anonymousAgent.fetchRootKey();
    }
    let ledger = await Actor.createActor(ledgerIDL, {
      agent: anonymousAgent,
      canisterId: "irzpe-yqaaa-aaaah-abhfa-cai",
    });
    let block = await Actor.createActor(blockIDL, {
      agent: anonymousAgent,
      canisterId: "iy2ey-oyaaa-aaaah-abheq-cai",
    });
    setBlock(block)
    setLedger(ledger)
    message.success("Ledger ready, you can query balance now.")
  }, []);

  async function getICPBanlance(){
    if(ledger == null){
      message.info("Please wait for the ledger actor to be created")
    }
    setQueryLoading(true)
    let address
    if(principal.length == 64){
      address = fromHexString(principal)
    } else {
      try{
        address = principalToAccountAddressArray(principal, 0);
      } catch (err) {
        message.error("Please check your principal/canisterID")
        setQueryLoading(false)
        return
      }
    }
    var args = {'account' : address};

    var icpBalance = await ledger.account_balance(args);
    console.log(icpBalance)
    var numICPBalance = parseInt(icpBalance.e8s);
    setBalance(numICPBalance);
    setQueryLoading(false)
  };

  async function claimICP(){
    if(ledger == null){
      message.info("Please wait for the ledger actor to be created")
    }
    setMintLoading(true)
    let address
    if(principal.length == 64){
      address = fromHexString(principal)
    } else {
      try{
        address = principalToAccountAddressArray(principal, 0);
      } catch (err) {
        message.error("Please check your principal/canisterID")
        setMintLoading(false)
        return
      }
    }
    var args = {
      'to' : address,
      fee: { e8s: 0 },
      memo: 0,
      from_subaccount: [Array(28).fill(0).concat(to32bits(0))],
      created_at_time: [],
      amount: { e8s: 100*1e8 },
    };

    var res = await ledger.claim(args);
    console.log(res)
    let height = parseInt(res.Ok);
    var res2 = await block.block(height);
    console.log(res2) 
    await getICPBanlance()
    setMintLoading(false)
  };

  function handleChange(e){
    setPrincipal(e.target.value)
  };


  return (
    <div className="App">
      
      <h2 className="content">
        Principal/CanisterID/Address : <Input className="input" onChange={handleChange}></Input>
        <br/> 
        Fake ICP Balance : {balance/100000000} 
        <br/> 
        <Button loading={queryLoading} onClick={getICPBanlance}>
          Query Balance
        </Button>
        <Button loading={mintLoading}  onClick={claimICP}>
          Claim 100 Fake ICP
        </Button>
      </h2>
    </div>
  );
};

export default App;