Rails.application.routes.draw do
  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end

  # Custom chatbot API routes - avoid conflict with Decidim API
  get 'chatbot-api/*path', to: 'api/chatbot#proxy'

  mount Decidim::Core::Engine => '/'
  mount Decidim::AdminHeader::Engine, at: '/'
  
  # Other API routes
  namespace :api do
    get 'jwt_token', to: 'jwt_tokens#show'
    resources :assets, only: [:index, :show], param: :id
  end
  
  # Catch malformed URLs with "undefined" parameters to prevent routing errors
  # This handles cases where frontend makes requests with undefined IDs
  get '*path', to: 'errors#not_found', constraints: lambda { |request|
    request.path.match?(/undefined/) && !request.path.start_with?('/api/')
  }
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
end
