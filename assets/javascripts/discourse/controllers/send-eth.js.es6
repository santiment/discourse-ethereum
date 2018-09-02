import ModalFunctionality from "discourse/mixins/modal-functionality";
import computed from "ember-addons/ember-computed-decorators";
import getUrl from "discourse-common/lib/get-url";
import { ajax } from "discourse/lib/ajax";

function getNetworkName(networkId) {
  let networkName;

  switch (networkId) {
    case "1":
      networkName = "main";
      break;
    case "3":
      networkName = "ropsten";
      break;
    case "4":
      networkName = "rinkeby";
      break;
    case "42":
      networkName = "kovan";
      break;
    default:
      networkName = "private";
  }

  return networkName;
}

function fromWei(bigNumber) {
  return web3.fromWei(bigNumber.toNumber());
}

export default Ember.Controller.extend(ModalFunctionality, {

  onShow() {
    this.setProperties({
      _balance: null,
      isLoading: false,
      amount: 0,
      isSuccess: false,
      transactionID: null,
      senderAddress: web3.eth.defaultAccount
    });

    web3.eth.getBalance(this.get("senderAddress"), (e, balance) => {
      e ? console.error(e) : this.set("_balance", balance);
    });
  },

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
    return (isLoading || !balance || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > balance);
  },

  @computed("amount")
  formatedAmount(amount) {
    return parseFloat(amount);
  },

  updateModal(opts) {
    opts = opts || {}

    opts.title = "discourse_ethereum.send_ethereum"

    this.appEvents.trigger("modal:body-shown", opts);
  },

  process() {
    this.set("isLoading", true);

    this.updateModal({ dismissable: false });

    web3.eth.sendTransaction({
      from: this.get("senderAddress"),
      to: this.get("model.ethereum_address"),
      value: web3.toWei(this.get("formatedAmount"))
    }, (err, transactionID) => {
      if (err) {
        this.error(err);
      } else {
        this.success(transactionID);
      }
    });
  },

  success(transactionID) {
    web3.eth.getTransaction(transactionID, (err, tx) => {
      if (err) return this.error(err);

      // create topic
      ajax(getUrl("/ethereum"), {
        type: "POST",
        data: {
          tx: {
            hash: tx.hash,
            from: {
              username: this.currentUser.get("username"),
              address: tx.from
            },
            to: {
              username: this.get("model.username"),
              address: tx.to
            },
            value: fromWei(tx.value),
            gas: tx.gas,
            gas_price: fromWei(tx.gasPrice),
            net_name: getNetworkName(web3.version.network)
          }
        }
      }).then((result) => {
        // bg job is created
        this.setProperties({
          isLoading: false,
          isSuccess: true,
          transactionID: tx.hash
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
