module Ethereum
  class TxDetail

    def initialize(tx)
      @tx = tx
    end

    def send_pm
      opts = {
        title: title,
        archetype: Archetype.private_message,
        target_usernames: target_usernames,
        raw: t("pm_body", table: tx_table),
        skip_validations: true
      }

      creator = User.find(-1)

      PostCreator.create!(creator, opts)
    end

    private

      def title
        tx_hash = @tx["hash"].first(10) + "..." + @tx["hash"].last(5) # use same format with metamask
        t("pm_title", hash: tx_hash)
      end

      def tx_table
        tx_url              = etherscan_url("tx", @tx["hash"])
        hash_td             = tx_url ? "[#{@tx["hash"]}](#{tx_url})" : @tx["hash"]
        contract_td         = @tx["token"] ? "[#{@tx["token"]}](#{etherscan_url("address", @tx["token"])})" : ""
        token_transfered_td = @tx["token_transfered"] ? "#{@tx["token_transfered"]} __#{@tx["symbol"]}__" : ""
        value_td            = @tx["value"] ? "#{@tx["value"]} __#{@tx["symbol"]}__" : ""

        [
          "| | |",
          "|-|-|",
          "#{t('pm_table.hash')}              | #{hash_td}",
          "#{t('pm_table.contract')}          | #{contract_td}",
          "#{t('pm_table.from')}              | #{username_and_address("from")}",
          "#{t('pm_table.to')}                | #{username_and_address("to")}",
          "#{t('pm_table.token_transfered')}  | #{token_transfered_td}",
          "#{t('pm_table.value')}             | #{value_td}",
          "#{t('pm_table.gas')}               | #{@tx["gas"]}",
          "#{t('pm_table.gas_price')}         | #{@tx["gas_price"]}"
        ].join("\n")
      end

      def t(path, args = {})
        I18n.t("discourse_ethereum.#{path}", args)
      end

      def target_usernames
        ["from", "to"].map { |k| @tx.dig(k, "username") }
      end

      def username_and_address(key)
        address = @tx.dig(key, "address")
        url     = user_etherscan_url(address)
        str     = "@#{@tx.dig(key, "username")} "

        str += url ? "([#{address}](#{url}))" : "(address)"

        str
      end

      def user_etherscan_url(address)
        @tx["token"] ? etherscan_url("token", @tx["token"] + "?a=" + address) : etherscan_url("address", address)
      end

      def etherscan_url(path, address)
        return if @tx["net_prefix"].nil?

        "https://#{@tx["net_prefix"]}etherscan.io/#{path}/#{address}"
      end

  end
end
