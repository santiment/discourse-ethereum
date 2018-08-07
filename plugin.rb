# name: discourse-ethereum
# version: 0.1
# author: ProCourse Team
# url: https://github.com/procourse/discourse-ethereum

enabled_site_setting :discourse_ethereum_enabled
register_asset "stylesheets/common.scss"
register_asset "stylesheets/mobile.scss", :mobile

after_initialize {

  require_dependency "discourse_plugin_registry"
  DiscoursePluginRegistry.serialized_current_user_fields << "ethereum_address"

  require_dependency "guardian"
  Guardian.class_eval {

    def can_do_eth_transaction?(target_user)
      return false unless authenticated?

      (current_user.id != target_user.id) && eth_enabled_for_user?(current_user) && eth_enabled_for_user?(target_user)
    end

    def eth_enabled_for_user?(user = nil)
      SiteSetting.discourse_ethereum_enabled && user && user.groups.where(name: SiteSetting.discourse_ethereum_groups.split("|")).exists?
    end

  }

  add_to_serializer(:user, :can_do_eth_transaction) {
    scope.can_do_eth_transaction?(object)
  }

}
