Rails.application.routes.draw do
  mount Decidim::AdminHeader::Engine => "/decidim-admin_header"
end
