module Ethereum
  class << self

    def send_tx_details(hash, from, to)
      url     = "https://api.infura.io/v1/jsonrpc/#{network}/eth_getTransactionByHash?params=[\"#{hash}\"]"
      result  = JSON.parse(open(url).read)["result"]

      opts = {
        title: t("pm_title", hash: result["hash"]),
        archetype: Archetype.private_message,
        target_usernames: [from.username, to.username],
        raw: t("pm_body", table: tx_table(result, from, to)),
        skip_validations: true
      }

      creator = User.find(-1)

      PostCreator.create!(creator, opts)
    end

    def tx_table(result, from, to)
      [
        "| | |",
        "|-|-|",
        "#{t('pm_table.hash')}      | [#{result['hash']}](https://#{network}.etherscan.io/tx/#{result['hash']})",
        "#{t('pm_table.from')}      | @#{from.username} (#{result['from']})",
        "#{t('pm_table.to')}        | @#{to.username} (#{result['to']})",
        "#{t('pm_table.value')}     | #{hex_to_ether(result['value'])} #{t('ether')}",
        "#{t('pm_table.gas')}       | #{from_hex(result['gas'])}",
        "#{t('pm_table.gas_price')} | #{hex_to_ether(result['gasPrice'])} #{t('ether')}"
      ].join("\n")
    end

    def t(path, args = {})
      I18n.t("discourse_ethereum.#{path}", args)
    end

    def network
      test? ? "kovan" : "mainnet"
    end

    def test?
      !Rails.env.production? || SiteSetting.discourse_ethereum_test
    end

    def from_hex(hex)
      hex.to_i(16)
    end

    def wei_to_ether(wei)
      BigDecimal((1.0 * wei / 10**18).to_s).to_s
    end

    def hex_to_ether(hex)
      wei_to_ether(from_hex(hex))
    end

  end
end
