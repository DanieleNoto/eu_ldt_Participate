Decidim::AdminHeader::Engine.routes.draw do
  scope "/admin/admin_header" do
    get 'keycloak_config', to: 'applications#keycloak_config'
  end
end
