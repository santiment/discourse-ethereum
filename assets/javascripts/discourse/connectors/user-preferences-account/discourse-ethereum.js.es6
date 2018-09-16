export default {

  shouldRender({ model }, component) {
    return model.get("eth_enabled_for_user") && component.siteSettings.discourse_ethereum_enabled;
  },

  setupComponent({ model }, _component) {
    model.set("custom_fields.ethereum_address", model.get("ethereum_address"));
  }

};
