import computed from "ember-addons/ember-computed-decorators";
import { etherscanURL } from "../controllers/send-eth";

export default Ember.Component.extend({

  classNames: ["eth-user"],

  @computed("site.mobileView")
  avatarSize(mobileView) {
    return (mobileView ? "large" : "extra_large");
  },

  @computed("user.ethereum_address")
  ethereumAddress(ethAddress) {
    return ethAddress || web3.eth.defaultAccount;
  },

  @computed("ethereumAddress")
  etherscanURL(ethAddress) {
    return etherscanURL("address", ethAddress);
  }

});
