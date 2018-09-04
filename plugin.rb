# name: discourse-ethereum
# version: 0.1.1
# author: ProCourse Team
# url: https://github.com/santiment/discourse-ethereum

enabled_site_setting :discourse_ethereum_enabled
register_asset "stylesheets/common.scss"
register_asset "stylesheets/mobile.scss", :mobile

require_relative "lib/ethereum"

after_initialize {

  load File.expand_path("../jobs/send_tx_details.rb", __FILE__)

  require_dependency "guardian"
  Guardian.class_eval {

    def can_do_eth_transaction?(target_user)
      return false unless authenticated?

      SiteSetting.discourse_ethereum_enabled &&
      (current_user.id != target_user.id) &&
      eth_enabled_for_user?(current_user) &&
      eth_enabled_for_user?(target_user) &&
      target_user.custom_fields["ethereum_address"].present?
    end

    def eth_enabled_for_user?(user = nil)
      user &&
      (SiteSetting.discourse_ethereum_all_user || user.groups.where(name: SiteSetting.discourse_ethereum_groups.split("|")).exists?)
    end

  }

  add_to_serializer(:user, :can_do_eth_transaction) {
    scope.can_do_eth_transaction?(object)
  }

  add_to_serializer(:user, :ethereum_address) {
    object.custom_fields["ethereum_address"].to_s.downcase
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
