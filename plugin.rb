# name: discourse-ethereum
# version: 0.1.4
# author: ProCourse Team
# url: https://github.com/santiment/discourse-ethereum

enabled_site_setting :discourse_ethereum_enabled
register_asset "stylesheets/common.scss"
register_asset "stylesheets/mobile.scss", :mobile

require_relative "lib/ethereum"

after_initialize {

  register_editable_user_custom_field("ethereum_address")

  load File.expand_path("../jobs/send_tx_details.rb", __FILE__)

  require_dependency "user"
  User.class_eval {
    def eth_enabled?
      !suspended? &&
      SiteSetting.discourse_ethereum_enabled &&
      (SiteSetting.discourse_ethereum_all_user ||
        self.groups.where(name: SiteSetting.discourse_ethereum_groups.split("|")).exists?)
    end
  }

  require_dependency "guardian"
  Guardian.class_eval {

    def can_do_eth_transaction?(target_user)
      return false unless authenticated?

      current_user&.eth_enabled? &&
      target_user&.eth_enabled? &&
      target_user.custom_fields["ethereum_address"].present?
    end

  }

  add_to_serializer(:user, :can_do_eth_transaction) {
    scope.can_do_eth_transaction?(object)
  }

  add_to_serializer(:user, :ethereum_address) {
    if scope.user&.eth_enabled? && eth_enabled_for_user
      object.custom_fields["ethereum_address"].to_s.downcase
    end
  }

  add_to_serializer(:user, :eth_enabled_for_user) {
    @eth_enabled_for_user ||= object&.eth_enabled?
  }

  require_dependency "application_controller"
  class ::EthereumController < ::ApplicationController
    requires_plugin("discourse-ethereum")
    before_action :ensure_logged_in

    def send_tx_details
      tx = params.require(:tx)

      Jobs.enqueue(:send_tx_details, tx.to_unsafe_hash)

      render json: success_json
    end
  end

  Discourse::Application.routes.append {

    post "ethereum" => "ethereum#send_tx_details"

  }

}
