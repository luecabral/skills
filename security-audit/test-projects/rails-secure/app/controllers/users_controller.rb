class UsersController < ApplicationController
  def show
    @user = User.find(params[:id])
    redirect_to user_path(@user)
  end
end
