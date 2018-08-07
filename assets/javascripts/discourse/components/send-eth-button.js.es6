import showModal from "discourse/lib/show-modal";

export default Ember.Component.extend({
  tagName: "span",

  isDisabled: Ember.computed.not("model.can_do_eth_transaction"),

  actions: {
    showSendEthModal() {
      showModal("send-eth", { model: this.get("model") });
    }
  }
});
