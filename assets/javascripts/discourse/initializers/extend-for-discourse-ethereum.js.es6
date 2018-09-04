import { withPluginApi } from "discourse/lib/plugin-api";
import PreferencesAccount from "discourse/controllers/preferences/account";

function initWithApi(api) {

  PreferencesAccount.reopen({

    saveAttrNames: ["name", "title", "custom_fields"],

    setEthAddressFor(obj) {
      obj.set("ethereum_address", this.get("model.custom_fields.ethereum_address"));
    },

    _updateEthereumAddress: function() {
      if (!this.siteSettings.discourse_ethereum_enabled) return;

      if (this.get("saved")) {
        this.setEthAddressFor(this.get("model"));
      }
    }.observes("saved")

  });

}

export default {
  name: "extend-for-discourse-ethereum",
  initialize() { withPluginApi("0.1", initWithApi); }
};
