admin_email = ENV["SYSTEM_ADMIN_EMAIL"] || "admin@admin.com"
admin_password = ENV["SYSTEM_ADMIN_PASSWORD"] || "decidim123456789"

organization_name = ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool"
organization_host = ENV["SYSTEM_ORG_HOST"] || "localhost"
organization_reference_prefix = ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT"

user_email = ENV["DEFAULT_USER_EMAIL"] || "user@example.org"
user_to_delete_email = ENV["DEFAULT_USER_TO_DELETE_EMAIL"] || "user2@example.org"
user_password = ENV["DEFAULT_USER_PASSWORD"] || "decidim123456789"

puts "--- Starting data preparation ---"

begin

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

puts "--- Creating system admin ---"
begin
  system_admin = Decidim::System::Admin.find_or_create_by!(email: admin_email) do |a|
    a.password = admin_password
    a.password_confirmation = admin_password
  end
rescue => e
  puts "--- Error creating system admin: #{e.message} ---"
  puts "--- Validation errors: #{e.record.errors.full_messages if e.respond_to?(:record) && e.record.respond_to?(:errors)} ---"
  raise e
end

puts "--- System admin #{admin_email} created successfully ---"

puts "--- Creating admin user for organization ---"
begin
  admin_user = Decidim::User.find_or_create_by!(email: admin_email, organization: org) do |u|
    u.password = admin_password
    u.password_confirmation = admin_password
    u.name = "Administrator"
    u.nickname = "admin"
    u.tos_agreement = true
    u.confirmed_at = Time.current
    u.last_sign_in_at = Time.current
    u.admin = true
    u.type = "Decidim::User"
    u.accepted_tos_version = Time.current
    u.password_updated_at = Time.current
    u.admin_terms_accepted_at = Time.current
  end
rescue => e
  puts "--- Error creating admin user: #{e.message} ---"
  puts "--- Validation errors: #{e.record.errors.full_messages if e.respond_to?(:record) && e.record.respond_to?(:errors)} ---"
  raise e
end

puts "--- Admin user #{admin_email} created and associated to organization ---"

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
    u.last_sign_in_at = Time.current
    u.admin = false
    u.type = "Decidim::User"
    u.accepted_tos_version = Time.current
    u.password_updated_at = Time.current
  end
  puts "--- User #{user.email} created and associated to organization ---"
end

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
  scoped_resource_id: terms_page.id
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

puts "--- Creating test participatory processes ---"

# First create a process type if needed
process_type = Decidim::ParticipatoryProcessType.find_or_create_by!(
  title: { "en" => "Testing Process Type" },
  decidim_organization_id: org.id
)
puts "--- Process type created: #{process_type.title} ---"

# Helper method to create process steps
def create_process_steps(process)
  # Create multiple steps to simulate a real process
  steps_data = [
    {
      title: { "en" => "Information and Preparation" },
      description: { "en" => "Initial phase where information is gathered and the process is prepared." },
      position: 1,
      active: false,
      start_date: 3.months.ago,
      end_date: 2.months.ago
    },
    {
      title: { "en" => "Participation and Proposals" },
      description: { "en" => "Active phase where citizens can submit proposals and participate in debates." },
      position: 2,
      active: true,
      start_date: 1.month.ago,
      end_date: 1.month.from_now
    },
    {
      title: { "en" => "Evaluation and Results" },
      description: { "en" => "Final phase where proposals are evaluated and results are published." },
      position: 3,
      active: false,
      start_date: 1.month.from_now,
      end_date: 3.months.from_now
    }
  ]

  steps_data.each do |step_data|
    Decidim::ParticipatoryProcessStep.find_or_create_by!(
      decidim_participatory_process_id: process.id,
      position: step_data[:position]
    ) do |step|
      step.title = step_data[:title]
      step.description = step_data[:description]
      step.active = step_data[:active]
      step.start_date = step_data[:start_date]
      step.end_date = step_data[:end_date]
      step.cta_text = { "en" => "Participate Now" }
      step.cta_path = "/processes/#{process.slug}"
    end
  end
end

# Helper method to create components for a process
def create_process_components(process)
  # Create Debates Component
  debates_component = Decidim::Component.find_or_create_by!(
    participatory_space_id: process.id,
    participatory_space_type: "Decidim::ParticipatoryProcess",
    manifest_name: "debates"
  ) do |component|
    component.name = { "en" => "Debates" }
    component.weight = 1
    component.published_at = Time.current
    component.settings = {
      "global" => {
        "comments_enabled" => true,
        "comments_max_length" => 1000,
        "announcement" => { "en" => "Welcome to the debates section!" }
      },
      "default_step" => {
        "comments_blocked" => false,
        "creation_enabled" => true
      }
    }
    component.permissions = {}
  end
  
  # Create Proposals Component
  proposals_component = Decidim::Component.find_or_create_by!(
    participatory_space_id: process.id,
    participatory_space_type: "Decidim::ParticipatoryProcess",
    manifest_name: "proposals"
  ) do |component|
    component.name = { "en" => "Proposals" }
    component.weight = 2
    component.published_at = Time.current
    component.settings = {
      "global" => {
        "votes_enabled" => true,
        "votes_blocked" => false,
        "votes_hidden" => false,
        "comments_enabled" => true,
        "comments_max_length" => 1000,
        "threshold_per_proposal" => 5,
        "can_accumulate_supports_beyond_threshold" => true,
        "proposal_length" => 500,
        "proposal_limit" => 1,
        "minimum_votes_per_user" => 3,
        "proposal_edit_time" => "limited",
        "proposal_edit_before_minutes" => 5,
        "announcement" => { "en" => "Submit your proposals here!" }
      },
      "default_step" => {
        "votes_enabled" => true,
        "votes_blocked" => false,
        "creation_enabled" => true,
        "proposal_answering_enabled" => true,
        "publish_answers_immediately" => true,
        "comments_blocked" => false,
        "endorsements_enabled" => true,
        "endorsements_blocked" => false
      }
    }
    component.permissions = {}
  end
  
  # Create Budgets Component
  budgets_component = Decidim::Component.find_or_create_by!(
    participatory_space_id: process.id,
    participatory_space_type: "Decidim::ParticipatoryProcess",
    manifest_name: "budgets"
  ) do |component|
    component.name = { "en" => "Participatory Budget" }
    component.weight = 3
    component.published_at = Time.current
    component.settings = {
      "global" => {
        "total_budget" => 1000000,
        "vote_threshold_percent" => 70,
        "comments_enabled" => true,
        "comments_max_length" => 1000,
        "announcement" => { "en" => "Allocate the community budget!" }
      },
      "default_step" => {
        "votes_enabled" => true,
        "show_votes" => false,
        "comments_blocked" => false
      }
    }
    component.permissions = {}
  end
  
  # Create Meetings Component  
  meetings_component = Decidim::Component.find_or_create_by!(
    participatory_space_id: process.id,
    participatory_space_type: "Decidim::ParticipatoryProcess",
    manifest_name: "meetings"
  ) do |component|
    component.name = { "en" => "Meetings" }
    component.weight = 4
    component.published_at = Time.current
    component.settings = {
      "global" => {
        "scopes_enabled" => true,
        "scope_id" => nil,
        "comments_enabled" => true,
        "comments_max_length" => 1000,
        "creation_enabled_for_participants" => true,
        "default_registration_terms" => { "en" => "Registration terms for meetings" },
        "announcement" => { "en" => "Join our community meetings!" }
      },
      "default_step" => {
        "comments_blocked" => false,
        "creation_enabled" => true,
        "registration_enabled" => true
      }
    }
    component.permissions = {}
  end

  return [debates_component, proposals_component, budgets_component, meetings_component]
end

# Process 1: process-to-delete
process_to_delete = Decidim::ParticipatoryProcess.find_or_create_by!(
  slug: "process-to-delete",
  decidim_organization_id: org.id
) do |process|
  process.title = { "en" => "Test Process for Deletion" }
  process.subtitle = { "en" => "A test process that can be safely deleted during testing" }
  process.short_description = { "en" => "This process is designed to test deletion functionality in the system." }
  process.description = { 
    "en" => "<p>This is a comprehensive test process created specifically for testing deletion operations. It contains all necessary components and data to ensure deletion functionality works correctly across all related entities.</p><p>This process includes multiple components like debates, proposals, budgets, and meetings to test cascade deletion scenarios.</p>"
  }
  process.hashtag = "TestDelete"
  process.promoted = false
  process.published_at = Time.current
  process.start_date = 2.months.ago.to_date
  process.end_date = 2.months.from_now.to_date
  process.private_space = false
  process.reference = "DEL-001"
  process.show_statistics = true
  process.show_metrics = true
  process.scopes_enabled = true
  process.weight = 1
  process.decidim_participatory_process_type_id = process_type.id
  process.announcement = { "en" => "This process will be used for deletion testing." }
end

create_process_steps(process_to_delete)
create_process_components(process_to_delete)
puts "--- Process 'process-to-delete' created successfully ---"

# Process 2: process-to-edit  
process_to_edit = Decidim::ParticipatoryProcess.find_or_create_by!(
  slug: "process-to-edit",
  decidim_organization_id: org.id
) do |process|
  process.title = { "en" => "Test Process for Editing" }
  process.subtitle = { "en" => "A test process that can be modified during testing" }
  process.short_description = { "en" => "This process is designed to test editing and updating functionality in the system." }
  process.description = { 
    "en" => "<p>This is a comprehensive test process created specifically for testing edit and update operations. It serves as a baseline that can be modified to test various update scenarios.</p><p>You can safely modify this process's properties, components, steps, and settings during testing without affecting other test processes.</p>"
  }
  process.hashtag = "TestEdit"
  process.promoted = true
  process.published_at = Time.current
  process.start_date = 1.month.ago.to_date
  process.end_date = 3.months.from_now.to_date
  process.private_space = false
  process.reference = "EDT-001"
  process.show_statistics = true
  process.show_metrics = true
  process.scopes_enabled = true
  process.weight = 2
  process.decidim_participatory_process_type_id = process_type.id
  process.announcement = { "en" => "This process can be modified for testing purposes." }
end

create_process_steps(process_to_edit)
create_process_components(process_to_edit)
puts "--- Process 'process-to-edit' created successfully ---"

# Process 3: process-to-view
process_to_view = Decidim::ParticipatoryProcess.find_or_create_by!(
  slug: "process-to-view",
  decidim_organization_id: org.id
) do |process|
  process.title = { "en" => "Test Process for Viewing" }
  process.subtitle = { "en" => "A read-only test process for viewing and navigation testing" }
  process.short_description = { "en" => "This process is designed to test viewing, navigation, and read-only functionality." }
  process.description = { 
    "en" => "<p>This is a comprehensive test process created specifically for testing viewing and navigation operations. It provides a stable baseline for read-only testing scenarios.</p><p>This process should remain unchanged during testing to ensure consistent test results. Use this for testing display, navigation, search, filtering, and other read-only operations.</p>"
  }
  process.hashtag = "TestView"
  process.promoted = true
  process.published_at = Time.current
  process.start_date = 3.weeks.ago.to_date
  process.end_date = 2.months.from_now.to_date
  process.private_space = false
  process.reference = "VIW-001"
  process.show_statistics = true
  process.show_metrics = true
  process.scopes_enabled = true
  process.weight = 3
  process.decidim_participatory_process_type_id = process_type.id
  process.announcement = { "en" => "This process is for viewing and navigation testing only." }
end

create_process_steps(process_to_view)
create_process_components(process_to_view)
puts "--- Process 'process-to-view' created successfully ---"

# Create a private process for testing private space functionality
process_private = Decidim::ParticipatoryProcess.find_or_create_by!(
  slug: "private-test-process",
  decidim_organization_id: org.id
) do |process|
  process.title = { "en" => "Private Test Process" }
  process.subtitle = { "en" => "A private process for testing access control" }
  process.short_description = { "en" => "This private process tests access control and permission functionality." }
  process.description = { 
    "en" => "<p>This is a private test process for testing access control mechanisms. Only authorized users should be able to access this process.</p><p>Use this process to test private space functionality, user permissions, and access control features.</p>"
  }
  process.hashtag = "TestPrivate"
  process.promoted = false
  process.published_at = Time.current
  process.start_date = 1.month.ago.to_date
  process.end_date = 1.month.from_now.to_date
  process.private_space = true
  process.reference = "PRV-001"
  process.show_statistics = false
  process.show_metrics = false
  process.scopes_enabled = false
  process.weight = 4
  process.decidim_participatory_process_type_id = process_type.id
  process.announcement = { "en" => "This is a private process for authorized users only." }
end

create_process_steps(process_private)
create_process_components(process_private)
puts "--- Private process 'private-test-process' created successfully ---"

# Assign process admin roles to admin user for all processes
[process_to_delete, process_to_edit, process_to_view, process_private].each do |process|
  Decidim::ParticipatoryProcessUserRole.find_or_create_by!(
    decidim_user_id: admin_user.id,
    decidim_participatory_process_id: process.id,
    role: "admin"
  )
  puts "--- Admin role assigned to #{admin_user.email} for process '#{process.slug}' ---"
end

# Create some sample process user roles for regular users
regular_user = Decidim::User.find_by(email: user_email, organization: org)
if regular_user
  Decidim::ParticipatoryProcessUserRole.find_or_create_by!(
    decidim_user_id: regular_user.id,
    decidim_participatory_process_id: process_to_view.id,
    role: "collaborator"
  )
  puts "--- Collaborator role assigned to #{regular_user.email} for process '#{process_to_view.slug}' ---"
end

puts "--- Test participatory processes created successfully ---"

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
  puts "--- This may take a few minutes... ---"
  
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