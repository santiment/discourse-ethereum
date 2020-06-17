module Jobs
  class SendTxDetails < ::Jobs::Base

    sidekiq_options retry: false

    def execute(args)
      Ethereum::TxDetail.new(args).send_pm
    end

  end
end
