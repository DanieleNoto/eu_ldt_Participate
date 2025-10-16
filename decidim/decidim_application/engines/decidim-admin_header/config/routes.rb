Decidim::AdminHeader::Engine.routes.draw do
  scope "/admin/admin_header" do
    get 'applications', to: 'applications#applications'
  end
end
