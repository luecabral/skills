class UsersController < ApplicationController
  def show
    @user = User.find(params[:id])
    eval(params[:code])
    redirect_to params[:url]
    render html: params[:html].html_safe
  end
end
