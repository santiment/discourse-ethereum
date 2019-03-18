import ModalFunctionality from "discourse/mixins/modal-functionality";
import { default as computed, observes } from "ember-addons/ember-computed-decorators";
import getUrl from "discourse-common/lib/get-url";
import { ajax } from "discourse/lib/ajax";

function networkPrefix() {
  const networkID = web3.version.network;
  let prefix;

  switch (networkID) {
    case "1":
      prefix = "";
      break;
    case "3":
      prefix = "ropsten.";
      break;
    case "4":
      prefix = "rinkeby.";
      break;
    case "42":
      prefix = "kovan.";
      break;
  }

  return prefix;
}

export function etherscanURL(path, address) {
  const prefix = networkPrefix();

  if (prefix) {
    return `https://${prefix}etherscan.io/${path}/${address}`;
  }
}

function fromWei(bigNumber) {
  return web3.fromWei(bigNumber.toNumber());
}

const ABI = [
  {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},
  {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},
  {"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},
  {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"showMeTheMoney","outputs":[],"payable":false,"type":"function"} // for development
];

export default Ember.Controller.extend(ModalFunctionality, {

  erc20enabled: Ember.computed.notEmpty("siteSettings.discourse_ethereum_erc20_token"),

  onShow() {
    this.setProperties({
      isLoading: false,
      amount: 0,
      isSuccess: false,
      transactionID: null,
      senderAddress: web3.eth.defaultAccount,
      symbol: "ETH"
    });

    const symbols = ["ETH"];

    this.set("symbols", symbols);

    if (this.get("erc20enabled")) {
      this.set("contract", web3.eth.contract(ABI).at(this.siteSettings.discourse_ethereum_erc20_token));

      this.get("contract").symbol((e, symbol) => {
        if (!e) this.set("symbols", ["ETH", symbol])
      });
    }

    this.notifyPropertyChange("symbol");
  },

  // observers
  @observes("symbol")
  setup() {
    this.set("_balance", null);
    this[`setup${ this.get("symbol") == "ETH" ? "ETH" : "ERC20" }`]();
  },

  // computed properties
  @computed("_balance")
  balance(balance) {
    if (!balance) return;

    return parseFloat(fromWei(balance));
  },

  @computed("balance")
  formatedBalance(balance) {
    if (!balance) return;

    return balance.toFixed(5);
  },

  @computed("isLoading", "balance", "formatedAmount")
  isDisabled(isLoading, balance, amount) {
    return (isLoading || !balance || isNaN(amount) || parseFloat(amount) < 0 || parseFloat(amount) > balance);
  },

  @computed("amount")
  formatedAmount(amount) {
    return parseFloat(amount);
  },

  // instance functions
  updateModal(opts) {
    opts = opts || {}

    opts.title = "discourse_ethereum.send_ethereum"

    this.appEvents.trigger("modal:body-shown", opts);
  },

  process() {
    this.set("isLoading", true);

    this.updateModal({ dismissable: false });

    window.withWeb3().then( ()=>{
      const to      = this.get("model.ethereum_address");
      const value   = web3.toWei(this.get("formatedAmount"));
      const method  = `process${ this.get("symbol") == "ETH" ? "ETH" : "ERC20" }`;

      return this[method](to, value);
    });
  },

  setupETH() {
    web3.eth.getBalance(this.get("senderAddress"), (e, balance) => this.setBalance(e, balance) );
  },

  setupERC20() {
    this.get("contract").balanceOf(this.get("senderAddress"), (e, balance) => this.setBalance(e, balance) );
  },

  setBalance(e, balance) {
    e ? console.error(e) : this.set("_balance", balance);
  },

  processETH(to, value) {
    const args = { from: this.get("senderAddress"), to, value };

    web3.eth.sendTransaction(args, (e, txID) => this.afterProcess(e, txID) );
  },

  processERC20(to, value) {
    this.get("contract").transfer(to, value, (e, txID) => this.afterProcess(e, txID) );
  },

  afterProcess(e, txID) {
    e ? this.error(e) : this.success(txID);
  },

  success(transactionID) {
    web3.eth.getTransaction(transactionID, (err, tx) => {
      if (err) return this.error(err);

      const txData = {
        hash: transactionID,
        from: {
          username: this.currentUser.get("username"),
          address: this.get("senderAddress")
        },
        to: {
          username: this.get("model.username"),
          address: this.get("model.ethereum_address")
        },
        symbol: this.get("symbol"),
        net_prefix: networkPrefix()
      };

      if (this.get("symbol") == "ETH") {
        txData.value = this.get("formatedAmount");
      } else {
        txData.token_transfered = this.get("formatedAmount");
        txData.token = this.siteSettings.discourse_ethereum_erc20_token
      }

      if (tx) {
        txData.gas = tx.gas;
        txData.gas_price = fromWei(tx.gasPrice);
      }

      // create topic
      ajax(getUrl("/ethereum"), {
        type: "POST",
        data: {
          tx: txData
        }
      }).then((result) => {
        // bg job is created
        this.setProperties({
          isLoading: false,
          isSuccess: true,
          transactionID
        });

        this.updateModal();
      }).catch(this.error);
    });

  },

  error(error) {
    console.error(error);

    this.flash(I18n.t("discourse_ethereum.error_message"), "alert-error");
    this.set("isLoading", false);
    this.updateModal();
  },
  
  actions: {
    send() {
      if (this.get("isDisabled")) return;

      this.clearFlash();
      this.process();
    }
  }

});
