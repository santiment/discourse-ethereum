import ModalFunctionality from "discourse/mixins/modal-functionality";
import computed from "ember-addons/ember-computed-decorators";
import getUrl from "discourse-common/lib/get-url";
import { ajax } from "discourse/lib/ajax";

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

    return parseFloat(web3.fromWei(balance.toNumber()));
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

    Ember.run.later(this, () => {
      web3.eth.sendTransaction({
        from: this.get("senderAddress"),
        to: this.get("model.ethereum_address"),
        value: web3.toWei(this.get("formatedAmount"))
      }, (err, transactionID) => {
        this.set("isLoading", false);

        if (err) {
          this.error(err);
        } else {
          this.success(transactionID);
        }

        this.updateModal();
      });
    }, 5 * 1000);
  },

  success(transactionID) {
    this.setProperties({
      isSuccess: true,
      transactionID: transactionID
    });

    ajax(getUrl("/ethereum"), {
      type: "POST",
      data: {
        tx_hash: transactionID,
        target_user_id: this.get("model.id")
      }
    });
  },

  error(error) {
    console.error(error);

    this.flash(I18n.t("discourse_ethereum.error_message"), "alert-error");
  },
  
  actions: {
    send() {
      if (this.get("isDisabled")) return;

      this.clearFlash();
      this.process();
    }
  }

});
