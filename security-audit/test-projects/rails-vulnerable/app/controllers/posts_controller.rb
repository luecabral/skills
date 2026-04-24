class PostsController < ApplicationController
  # Intentionally vulnerable — no before_action :authenticate_user

  def index
    # SQL injection via string interpolation (E4)
    @posts = Post.where("title LIKE '%#{params[:q]}%'")
  end

  def search
    # Command injection via system call (E3)
    system("grep -r '#{params[:term]}' /var/log")
  end

  def run
    # eval with user input (E1)
    instance_eval(params[:expr])
  end
end
