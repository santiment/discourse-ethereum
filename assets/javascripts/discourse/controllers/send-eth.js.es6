import ModalFunctionality from "discourse/mixins/modal-functionality";
import { default as computed, observes, on } from "ember-addons/ember-computed-decorators";
import { userPath } from "discourse/lib/url";

export default Ember.Controller.extend(ModalFunctionality, {

  onShow() {
    this.setProperties({
      _balance: null,
      isLoading: false,
      amount: 0,
      showConfirm: false,
      isSuccess: false,
      transactionID: null
    });

    web3.eth.getBalance(this.currentUser.get("ethereum_address"), (e, balance) => {
      e ? console.error(e) : this.set("_balance", balance);
    });
  },

  @computed("_balance")
  balance(balance) {
    if (!balance) return;

    return balance.dividedBy(1e18).toNumber();
  },

  @computed("balance")
  formatedBalance(balance) {
    if (!balance) return;

    return balance.toFixed(3);
  },

  @computed("isLoading", "balance", "formatedAmount")
  isDisabled(isLoading, balance, amount) {
    return (isLoading || !balance || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > balance);
  },

  @computed("amount")
  formatedAmount(amount) {
    return parseFloat(amount);
  },

  @computed("model.username")
  targetUserUrl(username) {
    return userPath(username);
  },

  updateModal(opts) {
    opts = opts || {}

    opts.title = "discourse_ethereum.send_ethereum"

    this.appEvents.trigger("modal:body-shown", opts);
  },

  process() {
    this.setProperties({
      isLoading: true,
      showConfirm: false
    });

    this.updateModal({ dismissable: false });

    Ember.run.later(this, () => {
      this.set("isLoading", false);
      this.success();
      this.updateModal();
    }, 5 * 1000);
  },

  success() {
    this.setProperties({
      isSuccess: true,
      transactionID: "0x7f9fade1c0d57a7af66ab4ead7c2eb7b11a91385"
    });
  },

  error(error) {
    this.flash(error, "alert-error");
  },
  
  actions: {
    showConfirm() {
      if (this.get("isDisabled")) return;

      this.clearFlash();
      this.set("showConfirm", true);
    },

    send() {
      this.process();
    },

    cancel() {
      this.set("showConfirm", false);
    }
  }

});
