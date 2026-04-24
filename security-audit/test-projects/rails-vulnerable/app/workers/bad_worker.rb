class BadWorker
  include Sidekiq::Worker

  # Intentionally vulnerable — sensitive args enqueued in clear (S4)
  def self.enqueue_login(user_id, password, auth_token)
    UserWorker.perform_async(user_id, password, auth_token)
  end

  def perform(user_id, password, auth_token)
    # ...
  end
end
