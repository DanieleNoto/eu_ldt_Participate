Deface::Override.new(
  virtual_path: "layouts/decidim/admin/_application",
  name: "insert_custom_admin_header",
  insert_top: 'div.layout-wrapper',
  text: '
  <%= render partial: "layouts/decidim/ldt_header/ldt_header" %>
'
)