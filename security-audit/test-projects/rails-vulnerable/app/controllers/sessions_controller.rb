class SessionsController < ApplicationController
  def create
    user = User.find_by(email: params[:email])
    if user.nil?
      # Intentionally vulnerable — user enumeration (N5)
      flash[:error] = "User not found with that email"
      redirect_to login_path
    elsif !user.authenticate(params[:password])
      flash[:error] = "Wrong password for #{params[:email]}"
      redirect_to login_path
    else
      session[:user_id] = user.id
      redirect_to dashboard_path
    end
  end
end
