# Intentionally vulnerable — caching tokens/secrets in Redis (Q5)
Rails.application.config.after_initialize do
  Rails.cache.write("user_token_#{1}", "abc123secret_token")
  Rails.cache.write("api_password_#{1}", "supersecret")
end
