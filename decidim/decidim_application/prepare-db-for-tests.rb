# Configurazione variabili di default
admin_email = ENV["SYSTEM_ADMIN_EMAIL"] || "admin@example.org"
admin_password = ENV["SYSTEM_ADMIN_PASSWORD"] || "decidim123456789"

organization_name = ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool"
organization_host = ENV["SYSTEM_ORG_HOST"] || "localhost"
organization_reference_prefix = ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT"

user_email = ENV["DEFAULT_USER_EMAIL"] || "user@example.org"
user_to_delete_email = ENV["DEFAULT_USER_TO_DELETE_EMAIL"] || "user2@example.org"
user_password = ENV["DEFAULT_USER_PASSWORD"] || "decidim123456789"

puts "--- Starting data preparation ---"

begin

# --- Prima crea l'organizzazione ---
puts "--- Creating organization ---"

begin
  org = Decidim::Organization.find_or_create_by!(host: organization_host) do |o|
    # Essential attributes
    o.name = { "en" => organization_name }
    o.reference_prefix = organization_reference_prefix
    o.default_locale = "en"
    o.available_locales = ["en"]
    o.tos_version = Time.current
    
    # Basic settings
    o.force_users_to_authenticate_before_access_organization = false
    o.users_registration_mode = "enabled"
    o.description = { "en" => "EU LDT Participate Tool - Citizen Participation Platform" }
    o.time_zone = "UTC"
    o.badges_enabled = true
    o.comments_max_length = 1000
    
    # Authorization settings
    o.available_authorizations = %w[id_documents postal_letter csv_census]
    
    # Initialize as empty arrays/hashes for complex settings
    o.secondary_hosts = []
    o.colors = {}
    o.file_upload_settings = {}
    o.content_security_policy = {}
    
    # String fields (can be empty)
    o.header_snippets = ""
    o.cta_button_text = ""
    o.cta_button_path = ""
    o.welcome_notification_subject = ""
    o.welcome_notification_body = ""
    o.smtp_settings = ""
    o.omniauth_settings = {}
    o.admin_terms_of_service_body = ""
    
    # Boolean fields
    o.enable_omnipresent_banner = false
    o.highlighted_content_banner_enabled = false
    o.send_welcome_notification = false
    o.user_groups_enabled = true
    o.rich_text_editor_in_public_views = false
    o.enable_machine_translations = false
    o.enable_participatory_space_filters = true
    
    # Banner fields (can be empty)
    o.omnipresent_banner_title = ""
    o.omnipresent_banner_short_description = ""
    o.omnipresent_banner_url = ""
    o.highlighted_content_banner_title = ""
    o.highlighted_content_banner_short_description = ""
    o.highlighted_content_banner_action_title = ""
    o.highlighted_content_banner_action_subtitle = ""
    o.highlighted_content_banner_action_url = ""
  end
  
  # Update complex settings after organization is created
  if org.persisted?
    org.update!(
      colors: {
        "primary" => "#53bf40",
        "secondary" => "#4053bf", 
        "tertiary" => "#bf4053"
      },
      file_upload_settings: {
        "allowed_file_extensions" => {
          "default" => %w[jpg jpeg png webp pdf rtf txt],
          "image" => %w[jpg jpeg png webp],
          "admin" => %w[jpg jpeg png webp pdf doc docx xls xlsx ppt pptx ppx rtf txt odt ott odf otg ods ots csv json md]
        },
        "allowed_content_types" => {
          "default" => %w[image/* application/pdf application/rtf text/plain],
          "admin" => %w[image/* application/pdf application/rtf application/json text/markdown text/plain text/csv]
        },
        "maximum_file_size" => {
          "default" => 10.0,
          "avatar" => 5.0
        }
      },
      external_domain_allowlist: ["decidim.org", "github.com"],
      machine_translation_display_priority: "original",
      extra_user_fields: { "enabled" => false }
    )
  end
rescue => e
  puts "--- Error creating organization: #{e.message} ---"
  puts "--- Validation errors: #{e.record.errors.full_messages if e.respond_to?(:record) && e.record.respond_to?(:errors)} ---"
  raise e
end

puts "--- Organization #{organization_name} created successfully with ID: #{org.id} ---"

puts "--- Data preparation completed successfully ---"

rescue => e
  puts "--- Failed to prepare default data. ---"
  puts "--- Error: #{e.message} ---"
  puts "--- Backtrace: ---"
  puts e.backtrace.join("\n")
  exit 1
end

# Alla fine del tuo script prepare-db-for-tests.rb
puts "--- Checking if fake data already exists ---"

# Controlla se esistono già dati fake (oltre ai tuoi utenti base)
existing_users_count = Decidim::User.where(organization: org).count
existing_processes_count = Decidim::ParticipatoryProcess.where(organization: org).count
existing_proposals_count = Decidim::Proposals::Proposal.joins(:component)
                            .where(component: { participatory_space: { decidim_organization_id: org.id } }).count rescue 0

# I tuoi utenti base sono 3, se ce ne sono molti di più significa che i seeds sono già stati eseguiti
if existing_users_count > 5 && existing_processes_count > 3 && existing_proposals_count > 10
  puts "--- Fake data already exists (#{existing_users_count} users, #{existing_processes_count} processes, #{existing_proposals_count} proposals). Skipping seeds generation. ---"
else
  puts "--- Generating fake data with Decidim seeds ---"
  puts "--- This may take an hour... ---"
  
  begin
    # Opzionale: riduci il numero di record generati
    original_number = ENV.fetch("DECIDIM_SEED_RECORDS", "5")
    ENV["DECIDIM_SEED_RECORDS"] = "2" # Riduci da 5 a 2 per velocizzare

    Decidim.seed!
    
    # Ripristina il valore originale
    ENV["DECIDIM_SEED_RECORDS"] = original_number
    
    puts "--- Decidim seeds completed successfully ---"
  rescue => e
    puts "--- Error running Decidim seeds: #{e.message} ---"
    puts e.backtrace.join("\n")
  end
end