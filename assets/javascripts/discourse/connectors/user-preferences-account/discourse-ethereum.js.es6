export default {

  shouldRender(_args, component) {
    return component.siteSettings.discourse_ethereum_enabled;
  },

  setupComponent({ model }, _component) {
    model.set("custom_fields.ethereum_address", model.get("ethereum_address"));
  }

};
