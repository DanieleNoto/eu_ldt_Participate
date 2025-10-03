Decidim::AdminHeader::Engine.routes.draw do
  scope "/admin/admin_header" do
    resources :applications, only: [:index]
  end
end
