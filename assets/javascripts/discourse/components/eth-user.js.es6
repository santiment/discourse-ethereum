import computed from "ember-addons/ember-computed-decorators";

export default Ember.Component.extend({

  classNames: ["eth-user"],

  @computed("site.mobileView")
  avatarSize(mobileView) {
    return (mobileView ? "large" : "extra_large");
  }

});
