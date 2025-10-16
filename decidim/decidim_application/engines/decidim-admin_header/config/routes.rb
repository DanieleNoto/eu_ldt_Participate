Decidim::AdminHeader::Engine.routes.draw do
  scope "/admin/admin_header" do
    get 'tool0_config', to: 'applications#tool0_config'
  end
end
