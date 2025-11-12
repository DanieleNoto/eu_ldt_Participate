Deface::Override.new(
  virtual_path: "decidim/devise/sessions/new",
  name: "add_keycloak_auto_login_meta_tag",
  insert_top: "head",
  text: %q~
<% auto_login_pending = params[:keycloak_auto_login].present? %>
<% Rails.logger.info "[Keycloak] Auto-login pending: #{auto_login_pending.inspect}, from URL param" %>
<% if auto_login_pending %>
<meta name="keycloak-auto-login" content="true" data-pending="true">
<% Rails.logger.info "[Keycloak] Meta tag inserted for auto-login" %>
<% end %>
~
)