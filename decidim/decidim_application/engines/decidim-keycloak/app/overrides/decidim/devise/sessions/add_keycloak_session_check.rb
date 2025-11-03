Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_meta_tag",
  insert_top: "head",
  text: %q~
<% if session.delete(:keycloak_auto_login_pending) %>
<meta name="keycloak-auto-login" content="true" data-pending="true">
<% end %>
~
)