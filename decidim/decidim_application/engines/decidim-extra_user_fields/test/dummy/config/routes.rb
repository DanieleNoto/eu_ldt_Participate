Rails.application.routes.draw do
  mount Decidim::ExtraUserFields::Engine => "/decidim-extra_user_fields"
end
