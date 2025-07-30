organization_name = ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool"
organization_host = ENV["SYSTEM_ORG_HOST"] || "localhost"
organization_reference_prefix = ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT"


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
        "primary" => "#004494",
        "secondary" => "#FFD617",
        "tertiary" => "#C21D76"
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


puts "--- Basic data preparation completed successfully ---"

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


puts "--- Fake data already exists (#{existing_users_count} users, #{existing_processes_count} processes, #{existing_proposals_count} proposals). ---"
if existing_users_count > 5 && existing_processes_count > 3 && existing_proposals_count > 10
  puts "--- Skipping seeds generation. ---"
else
  puts "--- Generating fake data with Decidim seeds ---"
  puts "--- This may take an hour... ---"

  begin
    Decidim.seed!
    puts "--- Decidim seeds completed successfully ---"
  rescue => e
    puts "--- Error running Decidim seeds: #{e.message} ---"
    puts e.backtrace.join("\n")
  end
end


# --- Generate dynamic moderation test data ---
puts "--- Generating moderation test data ---"

begin
  users = Decidim::User.where(organization: org).limit(10)
  processes = Decidim::ParticipatoryProcess.where(organization: org).limit(5)
  components = Decidim::Component.where(participatory_space: processes, manifest_name: "proposals")
  proposals = Decidim::Proposals::Proposal.where(component: components).limit(10)
  proposal_ids = proposals.pluck(:id)
  comments = Decidim::Comments::Comment.where(
    decidim_commentable_type: "Decidim::Proposals::Proposal",
    decidim_commentable_id: proposal_ids
  ).limit(10)

  if users.any? && processes.any? && proposals.any?
    # Create user moderations
    user_to_moderate = users.first
    user_moderation = Decidim::UserModeration.find_or_create_by(
      decidim_user_id: user_to_moderate.id
    ) do |um|
      um.report_count = 0
    end

    # Create user report
    reporter_user = users.second || users.first
    Decidim::UserReport.find_or_create_by(
      user_moderation_id: user_moderation.id,
      user_id: reporter_user.id
    ) do |ur|
      ur.reason = "spam"
      ur.details = "Test user report generated by seeds"
    end

    # Create proposal moderations and reports
    proposals.limit(3).each_with_index do |proposal, index|
      process = processes.first

      moderation = Decidim::Moderation.find_or_create_by(
        decidim_participatory_space_id: process.id,
        decidim_reportable_type: "Decidim::Proposals::Proposal",
        decidim_reportable_id: proposal.id,
        decidim_participatory_space_type: "Decidim::ParticipatoryProcess"
      ) do |m|
        m.report_count = index == 0 ? 0 : 1
        m.hidden_at = index == 0 ? Time.current : nil
        m.reported_content = "#{proposal.title['en'] || proposal.title.values.first}\n#{proposal.body['en'] || proposal.body.values.first}"
      end

      # Create report for this moderation
      reporting_user = users.sample
      Decidim::Report.find_or_create_by(
        decidim_moderation_id: moderation.id,
        decidim_user_id: reporting_user.id
      ) do |r|
        r.reason = ["spam", "offensive", "irrelevant"].sample
        r.details = "Test report #{index + 1} generated by seeds"
        r.locale = "en"
      end
    end

    # Create comment moderations and reports if comments exist
    if comments.any?
      comments.limit(2).each_with_index do |comment, index|
        process = processes.first

        moderation = Decidim::Moderation.find_or_create_by(
          decidim_participatory_space_id: process.id,
          decidim_reportable_type: "Decidim::Comments::Comment",
          decidim_reportable_id: comment.id,
          decidim_participatory_space_type: "Decidim::ParticipatoryProcess"
        ) do |m|
          m.report_count = 1
          m.reported_content = "#{comment.author.name}\n#{comment.body['en'] || comment.body.values.first}"
        end

        # Create report for this comment moderation
        reporting_user = users.sample
        Decidim::Report.find_or_create_by(
          decidim_moderation_id: moderation.id,
          decidim_user_id: reporting_user.id
        ) do |r|
          r.reason = ["spam", "offensive"].sample
          r.details = "Test comment report #{index + 1} generated by seeds"
          r.locale = "en"
        end
      end
    end

    puts "--- Moderation test data generated successfully ---"
  else
    puts "--- Warning: Not enough seeded data to create moderation test data ---"
  end

rescue => e
  puts "--- Error generating moderation test data: #{e.message} ---"
  puts e.backtrace.join("\n")
end
