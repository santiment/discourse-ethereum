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

  window.withWeb3 = function () {
    if(window.web3) {
      return Promise.resolve(window.web3);
    } else if(window.ethereum) {
      return window.ethereum.enable()
        .then(()=> {
          window.web3 = new Web3(ethereum);
          return window.web3;
        })
        .catch( (error)=>{
          console.log("User denied account access...", error);
          throw error;
        })
    } else {
      console.log("Non-Ethereum browser detected. You should consider trying Metamask!");
      return Promise.reject("No web3 detected");
    }
  }
}

export default {
  name: "extend-for-discourse-ethereum",
  initialize() { withPluginApi("0.1", initWithApi); }
};
