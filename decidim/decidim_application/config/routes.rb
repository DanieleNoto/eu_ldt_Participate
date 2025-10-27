Rails.application.routes.draw do
  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end

  namespace :api do
    get 'jwt_token', to: 'jwt_tokens#show'
  end

  mount Decidim::Core::Engine => '/'
  mount Decidim::AdminHeader::Engine, at: '/'
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
