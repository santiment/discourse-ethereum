module Jobs
  class SendTxDetails < Jobs::Base

    sidekiq_options retry: false

    def execute(args)
      from  = User.find(args[:from_id])
      to    = User.find(args[:to_id])

      Ethereum.send_tx_details(args[:hash], from, to)
    end

  end
end
