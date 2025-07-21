# Configurazione variabili di default
admin_email = ENV["SYSTEM_ADMIN_EMAIL"] || "admin@admin.com"
admin_password = ENV["SYSTEM_ADMIN_PASSWORD"] || "decidim123456789"

organization_name = ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool"
organization_host = ENV["SYSTEM_ORG_HOST"] || "localhost"
organization_reference_prefix = ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT"

user_email = ENV["DEFAULT_USER_EMAIL"] || "user@example.com"
user_to_delete_email = ENV["DEFAULT_USER_TO_DELETE_EMAIL"] || "user-to-delete@example.com"
user_password = ENV["DEFAULT_USER_PASSWORD"] || "decidim123456789"

puts "--- Starting data preparation ---"

# --- Prima crea l'organizzazione ---
puts "--- Creating organization ---"
org = Decidim::Organization.find_or_create_by!(host: organization_host) do |o|
  o.name = { "en" => organization_name }
  o.reference_prefix = organization_reference_prefix
  o.default_locale = "en"
  o.available_locales = ["en"]
  o.force_users_to_authenticate_before_access_organization = false
  o.users_registration_mode = "enabled"
  o.available_authorizations = %w[id_documents postal_letter csv_census]
  o.description = { "en" => "EU LDT Participate Tool - Citizen Participation Platform" }
  o.secondary_hosts = []
  o.header_snippets = ""
  o.cta_button_text = ""
  o.cta_button_path = ""
  o.enable_omnipresent_banner = false
  o.omnipresent_banner_title = ""
  o.omnipresent_banner_short_description = ""
  o.omnipresent_banner_url = ""
  o.highlighted_content_banner_enabled = false
  o.highlighted_content_banner_title = ""
  o.highlighted_content_banner_short_description = ""
  o.highlighted_content_banner_action_title = ""
  o.highlighted_content_banner_action_subtitle = ""
  o.highlighted_content_banner_action_url = ""
  o.tos_version = Time.current
  o.badges_enabled = true
  o.send_welcome_notification = true
  o.welcome_notification_subject = ""
  o.welcome_notification_body = ""
  o.users_registration_mode = 0  # 0 = enabled
  o.id_documents_methods = ["online"]
  o.id_documents_explanation_text = { "en" => "Explain here how to submit ID documents" }
  o.user_groups_enabled = true
  o.smtp_settings = ""
  o.colors = {
    "primary" => "#53bf40",
    "secondary" => "#4053bf", 
    "tertiary" => "#bf4053"
  }
  o.omniauth_settings = {}
  o.rich_text_editor_in_public_views = false
  o.admin_terms_of_service_body = ""
  o.time_zone = "UTC"
  o.enable_machine_translations = false
  o.comments_max_length = 1000
  o.file_upload_settings = {
    allowed_file_extensions: {
      default: %w[jpg jpeg png webp pdf rtf txt],
      image: %w[jpg jpeg png webp],
      admin: %w[jpg jpeg png webp pdf doc docx xls xlsx ppt pptx ppx rtf txt odt ott odf otg ods ots csv json md]
    },
    allowed_content_types: {
      default: %w[image/* application/pdf application/rtf text/plain],
      admin: %w[
        image/*
        application/vnd.oasis.opendocument
        application/vnd.ms-*
        application/msword
        application/vnd.ms-word
        application/vnd.openxmlformats-officedocument
        application/pdf
        application/rtf
        application/json
        text/markdown
        text/plain
        text/csv
      ]
    },
    maximum_file_size: {
      default: 10.0,
      avatar: 5.0
    }
  }
  o.machine_translation_display_priority = "original"
  o.external_domain_allowlist = ["decidim.org", "github.com"]
  o.enable_participatory_space_filters = true
  o.content_security_policy = {
    "img-src" => "",
    "font-src" => "",
    "frame-src" => "",
    "media-src" => "",
    "style-src" => "",
    "script-src" => "",
    "connect-src" => "",
    "default-src" => ""
  }
  o.extra_user_fields = { "enabled" => false }
end

puts "--- Organization #{organization_name} created successfully with ID: #{org.id} ---"

# --- Crea l'admin di sistema ---
puts "--- Creating system admin ---"
system_admin = Decidim::System::Admin.find_or_create_by!(email: admin_email) do |a|
  a.password = admin_password
  a.password_confirmation = admin_password
end

puts "--- System admin #{admin_email} created successfully ---"

# --- Crea l'admin come utente dell'organizzazione ---
puts "--- Creating admin user for organization ---"
admin_user = Decidim::User.find_or_create_by!(email: admin_email, organization: org) do |u|
  u.password = admin_password
  u.password_confirmation = admin_password
  u.name = "Administrator"
  u.nickname = "admin"
  u.tos_agreement = true
  u.confirmed_at = Time.current
  u.admin = true
  u.type = "Decidim::User"
  u.accepted_tos_version = org.tos_version  # Use organization's TOS version
  u.last_sign_in_at = Time.current
  u.password_updated_at = Time.current  # Prevent password change prompt
  u.sign_in_count = 1  # Mark as having signed in before
end

# Create authorization for admin to prevent identity verification prompt
admin_authorization = Decidim::Authorization.find_or_create_by!(
  user: admin_user,
  name: "id_documents"
) do |auth|
  auth.metadata = {}
  auth.unique_id = "#{admin_user.email}_admin_#{Time.current.to_i}"
  auth.granted_at = Time.current
end

puts "--- Admin user #{admin_email} created and associated to organization with authorization ---"

# --- Crea altri utenti associati all'organizzazione ---
puts "--- Creating regular users ---"
users = [
  { email: user_email, nickname: "user", name: "User Test" },
  { email: user_to_delete_email, nickname: "user-to-delete", name: "User To Delete" }
]

users.each do |user_attrs|
  user = Decidim::User.find_or_create_by!(email: user_attrs[:email], organization: org) do |u|
    u.password = user_password
    u.password_confirmation = user_password
    u.nickname = user_attrs[:nickname]
    u.name = user_attrs[:name]
    u.tos_agreement = true
    u.confirmed_at = Time.current
    u.admin = false
    u.type = "Decidim::User"
    u.accepted_tos_version = org.tos_version  # Use organization's TOS version
    u.last_sign_in_at = Time.current
    u.password_updated_at = Time.current  # Prevent password change prompt
    u.sign_in_count = 1  # Mark as having signed in before
  end
  
  # Create authorization to prevent identity verification prompt
  authorization = Decidim::Authorization.find_or_create_by!(
    user: user,
    name: "id_documents"
  ) do |auth|
    auth.metadata = {}
    auth.unique_id = "#{user.email}_#{Time.current.to_i}"
    auth.granted_at = Time.current
  end
  
  puts "--- User #{user.email} created and associated to organization with authorization ---"
end

# --- Crea static page topics ---
puts "--- Creating static page topics ---"

# General topic
general_topic = Decidim::StaticPageTopic.find_or_create_by!(
  organization: org,
  title: { "en" => "General" }
) do |topic|
  topic.description = { "en" => "Read more about test." }
  topic.weight = 0
  topic.show_in_footer = true
end

puts "--- Static page topics created successfully ---"

# --- Crea le pagine statiche essenziali ---
puts "--- Creating static pages ---"

# Terms of Service page
terms_page = Decidim::StaticPage.find_or_create_by!(slug: "terms-of-service", organization: org) do |page|
  page.title = {
    "en" => "Default title for Terms of service",
  }
  page.content = {
    "en" => "Please add meaningful content to the Terms of service static page on the admin dashboard.",
  }
  page.allow_public_access = true
  page.weight = 0
  page.topic = general_topic
end

# Create summary content block for Terms of Service page
summary_block = Decidim::ContentBlock.find_or_create_by!(
  organization: org,
  scope_name: "static_page",
  manifest_name: "summary",
  scoped_resource_id: terms_page.id,
) do |content_block|
  content_block.weight = 1
  content_block.published_at = Time.current
  content_block.settings = {
    "summary" => {
      "en" => "Please add meaningful summary to the Terms of service static page on the admin dashboard."
    }
  }
  content_block.images = {}
end
puts "--- Summary content block for Terms of Service page created successfully ---"

# Help page
help_page = Decidim::StaticPage.find_or_create_by!(slug: "help", organization: org) do |page|
  page.title = { "en" => "What can I do in test?" }
  page.content = { 
    "en" => "<p>In test you can participate and decide on different topics, through the spaces you see in the top menu: Processes, Assemblies, Initiatives, Consultations.</p> <p>Within each one you will find different options to participate: make proposals - individually or with other people-, take part in debates, prioritize projects to implement, attend face-to-face meetings and other actions.</p>\n"
  }
  page.allow_public_access = false
  page.weight = 0
  page.topic = general_topic
end

# Participatory Processes page
participatory_processes_page = Decidim::StaticPage.find_or_create_by!(slug: "participatory_processes", organization: org) do |page|
  page.title = { "en" => "What is a participatory process?" }
  page.content = { 
    "en" => "<p>A <strong>participatory process</strong> is a sequence of participatory activities (e.g. first filling out a survey, then making proposals, discussing them in face-to-face or virtual meetings, and finally prioritizing them) with the aim of defining and making a decision on a specific topic.</p> <p>Examples of participatory processes are: a process of electing committee members (where candidatures are first presented, then debated and finally a candidacy is chosen), participatory budgets (where proposals are made, valued economically and voted on with the money available), a strategic planning process, the collaborative drafting of a regulation or norm, the design of an urban space or the production of a public policy plan.</p>\n"
  }
  page.allow_public_access = false
  page.weight = 1
  page.topic = general_topic
end

# Assemblies page
assemblies_page = Decidim::StaticPage.find_or_create_by!(slug: "assemblies", organization: org) do |page|
  page.title = { "en" => "What are assemblies?" }
  page.content = { 
    "en" => "<p>An <strong>assembly</strong> is a group of members of an organization who meet periodically to make decisions about a specific area or scope of the organization.</p> <p>Assemblies hold meetings, some are private and some are open. If they are open, it is possible to participate in them (for example: attending if the capacity allows it, adding points to the agenda, or commenting on the proposals and decisions taken by this organ).</p> <p>Examples: A general assembly (which meets once a year to define the organisation's main lines of action as well as its executive bodies by vote), an equality advisory council (which meets every two months to make proposals on how to improve gender relations in the organisation), an evaluation commission (which meets every month to monitor a process) or a guarantee body (which collects incidents, abuses or proposals to improve decision-making procedures) are all examples of assemblies.</p>\n"
  }
  page.allow_public_access = false
  page.weight = 2
  page.topic = general_topic
end

puts "--- Static pages created successfully ---"

# --- Crea contextual help sections ---
puts "--- Creating contextual help sections ---"

# Participatory Processes contextual help
participatory_processes_help = Decidim::ContextualHelpSection.find_or_create_by!(
  organization: org,
  section_id: "participatory_processes"
) do |help_section|
  help_section.content = {
    "en" => "<p>A <strong>participatory process</strong> is a sequence of participatory activities (e.g. first filling out a survey, then making proposals, discussing them in face-to-face or virtual meetings, and finally prioritizing them) with the aim of defining and making a decision on a specific topic.</p> <p>Examples of participatory processes are: a process of electing committee members (where candidatures are first presented, then debated and finally a candidacy is chosen), participatory budgets (where proposals are made, valued economically and voted on with the money available), a strategic planning process, the collaborative drafting of a regulation or norm, the design of an urban space or the production of a public policy plan.</p>\n"
  }
end

# Assemblies contextual help
assemblies_help = Decidim::ContextualHelpSection.find_or_create_by!(
  organization: org,
  section_id: "assemblies"
) do |help_section|
  help_section.content = {
    "en" => "<p>An <strong>assembly</strong> is a group of members of an organization who meet periodically to make decisions about a specific area or scope of the organization.</p> <p>Assemblies hold meetings, some are private and some are open. If they are open, it is possible to participate in them (for example: attending if the capacity allows it, adding points to the agenda, or commenting on the proposals and decisions taken by this organ).</p> <p>Examples: A general assembly (which meets once a year to define the organisation's main lines of action as well as its executive bodies by vote), an equality advisory council (which meets every two months to make proposals on how to improve gender relations in the organisation), an evaluation commission (which meets every month to monitor a process) or a guarantee body (which collects incidents, abuses or proposals to improve decision-making procedures) are all examples of assemblies.</p>\n"
  }
end

puts "--- Contextual help sections created successfully ---"

# --- Crea i content blocks per la homepage ---
puts "--- Creating homepage content blocks ---"

content_blocks = [
  { manifest_name: "hero", weight: 10 },
  { manifest_name: "global_menu", weight: 20 },
  { manifest_name: "sub_hero", weight: 30 },
  { manifest_name: "highlighted_content_banner", weight: 40 },
  { manifest_name: "how_to_participate", weight: 50 },
  { manifest_name: "last_activity", weight: 60 },
  { manifest_name: "stats", weight: 70 },
  { manifest_name: "footer_sub_hero", weight: 80 },
  { manifest_name: "upcoming_meetings", weight: 90 }
]

content_blocks.each do |block_attrs|
  block = Decidim::ContentBlock.find_or_create_by!(
    organization: org,
    scope_name: "homepage",
    manifest_name: block_attrs[:manifest_name]
  ) do |content_block|
    content_block.weight = block_attrs[:weight]
    content_block.published_at = Time.current
    content_block.settings = {}
    content_block.images = {}
  end
  puts "--- Content block '#{block_attrs[:manifest_name]}' created successfully ---"
end

puts "--- Homepage content blocks created successfully ---"

puts "--- Data preparation completed successfully ---"
