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
        url     = etherscan_url
        hash_td = url ? "[#{@tx["hash"]}](#{url})" : @tx["hash"]

        [
          "| | |",
          "|-|-|",
          "#{t('pm_table.hash')}      | #{hash_td}",
          "#{t('pm_table.from')}      | #{username_and_address("from")}",
          "#{t('pm_table.to')}        | #{username_and_address("to")}",
          "#{t('pm_table.value')}     | #{@tx["value"]}",
          "#{t('pm_table.gas')}       | #{@tx["gas"]}",
          "#{t('pm_table.gas_price')} | #{@tx["gas_price"]}"
        ].join("\n")
      end

      def t(path, args = {})
        I18n.t("discourse_ethereum.#{path}", args)
      end

      def target_usernames
        ["from", "to"].map { |k| @tx.dig(k, "username") }
      end

      def username_and_address(key)
        "@#{@tx.dig(key, "username")} (#{@tx.dig(key, "address")})"
      end

      def etherscan_url
        return if @tx["net_name"] == "private"

        prefix = case @tx["net_name"]
          when "main"
            ""
          else
            @tx["net_name"] + "."
          end

        "https://#{prefix}etherscan.io/tx/#{@tx["hash"]}"
      end

  end
end
