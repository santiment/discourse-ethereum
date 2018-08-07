import { withPluginApi } from "discourse/lib/plugin-api";
import { default as computed, observes, on } from "ember-addons/ember-computed-decorators";
import PreferencesAccount from "discourse/controllers/preferences/account";

function initWithApi(api) {

  PreferencesAccount.reopen({

    saveAttrNames: function() {
      return ["name", "title", "custom_fields"];
    }.property()

  });

}

export default {
  name: "extend-for-discourse-ethereum",
  initialize() { withPluginApi("0.1", initWithApi); }
};
