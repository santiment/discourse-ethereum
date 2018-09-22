import computed from "ember-addons/ember-computed-decorators";
import { etherscanURL } from "../controllers/send-eth";

export default Ember.Component.extend({

  classNames: ["eth-user"],

  @computed("site.mobileView")
  avatarSize(mobileView) {
    return (mobileView ? "large" : "extra_large");
  },

  @computed("ethereumAddress")
  etherscanURL(ethAddress) {
    return etherscanURL("address", ethAddress);
  },

  @computed("ethereumAddress")
  formatedEthereumAddress(ethAddress) {
    return ethAddress.slice(0, 10) + "..." + ethAddress.slice(37);
  }

});
