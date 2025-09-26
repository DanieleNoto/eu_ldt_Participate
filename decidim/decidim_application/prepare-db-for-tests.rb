organization_name = ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool"
organization_desc = ENV["SYSTEM_ORG_DESC"] || "EU LDT Participate Tool - Citizen Participation Platform"
organization_host = ENV["SYSTEM_ORG_HOST"] || "localhost"
organization_reference_prefix = ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT"
organization_color_primary = ENV["SYSTEM_ORG_COLOR_PRIMARY"] || "#004494"
organization_color_secondary = ENV["SYSTEM_ORG_COLOR_SECONDARY"] || "#004494"
organization_color_tertiary = ENV["SYSTEM_ORG_COLOR_TERTIARY"] || "#FFE77E"

puts "--- Starting data preparation ---"

begin
  puts "--- DEBUG: Before organization creation ---"
  puts "--- Creating organization ---"

  begin
    org = Decidim::Organization.find_or_create_by!(host: organization_host) do |o|
      # Minimal attributes: keep only those from ENV and essentials
      o.name = { "en" => organization_name }
      o.reference_prefix = organization_reference_prefix
      # Available locales required by user: English, French, Spanish, German
      o.available_locales = %w[en fr es de]
      o.description = { "en" => organization_desc }
      o.default_locale = "en"
      o.tos_version = Time.current
      o.force_users_to_authenticate_before_access_organization = false
      o.users_registration_mode = "enabled"
    end

    # Update complex settings after organization is created
    if org.persisted?
      # Only update colors which are driven by ENV; keep other settings minimal
      org.update!(
        colors: {
          "primary" => organization_color_primary,
          "secondary" => organization_color_secondary,
          "tertiary" => organization_color_tertiary
        }
      )
    end
  rescue => e
    puts "--- Error creating organization: #{e.message} ---"
    puts "--- Validation errors: #{e.record.errors.full_messages if e.respond_to?(:record) && e.record.respond_to?(:errors)} ---"
    raise e
  end

  puts "--- Organization #{organization_name} created successfully with ID: #{org.id} ---"
  puts "--- DEBUG: After organization creation, before users ---"

  # Create basic users for the organization to allow seeds to work properly
  puts "--- Creating basic users ---"
  # Only create basic users when not running in the development environment.
  # Detect via Rails.env if available, or fall back to ENV['RAILS_ENV'].
  if (defined?(Rails) && Rails.env.development?) || ENV["RAILS_ENV"] == "development"
    puts "--- Skipping creation of basic users because environment is development ---"
  else
    begin
      # Create system admin user (for /system access)
      puts "--- Creating system user... ---"
      system_user = Decidim::User.find_or_create_by!(
        email: "system@example.org",
        organization: org
      ) do |user|
        user.name = "System Administrator"
        user.nickname = "system"
        user.password = "decidim123456789"
        user.password_confirmation = "decidim123456789"
        user.confirmed_at = Time.current
        user.admin = true
        user.system = true
        user.tos_agreement = true
      end
      puts "--- System user created: #{system_user.email} (for /system access) ---"

      # Aggiungi l'utente system come system admin
      if defined?(Decidim::System::Admin)
        Decidim::System::Admin.find_or_create_by!(user: system_user)
      elsif ActiveRecord::Base.connection.table_exists?(:decidim_system_admins)
        # fallback diretto se la costante non è caricata
        system_admins = ActiveRecord::Base.connection.execute("SELECT * FROM decidim_system_admins WHERE user_id = #{system_user.id}")
        if system_admins.none?
          ActiveRecord::Base.connection.execute("INSERT INTO decidim_system_admins (user_id, created_at, updated_at) VALUES (#{system_user.id}, '#{Time.now.utc.to_s(:db)}', '#{Time.now.utc.to_s(:db)}')")
        end
      end

      # Create organization admin user
      puts "--- Creating admin user... ---"
      admin_user = Decidim::User.find_or_create_by!(
        email: "admin@example.org",
        organization: org
      ) do |user|
        user.name = "Organization Admin"
        user.nickname = "admin"
        user.password = "decidim123456789"
        user.password_confirmation = "decidim123456789"
        user.confirmed_at = Time.current
        user.admin = true
        user.tos_agreement = true
      end
      puts "--- Admin user created: #{admin_user.email} ---"

      # Create regular user
      puts "--- Creating regular user... ---"
      regular_user = Decidim::User.find_or_create_by!(
        email: "user@example.org",
        organization: org
      ) do |user|
        user.name = "Regular User"
        user.nickname = "user"
        user.password = "decidim123456789"
        user.password_confirmation = "decidim123456789"
        user.confirmed_at = Time.current
        user.admin = false
        user.tos_agreement = true
      end
      puts "--- Regular user created: #{regular_user.email} ---"
    rescue => e
      puts "--- Error creating basic users: #{e.message} ---"
      puts "--- User creation failed with: #{e.class} ---"
      if e.respond_to?(:record) && e.record.respond_to?(:errors)
        puts "--- Validation errors: #{e.record.errors.full_messages} ---"
      end
      puts "--- Backtrace: ---"
      puts e.backtrace.first(10).join("\n")
      # Don't exit, continue with seed attempts
    end
  end

  puts "--- Basic data preparation completed successfully ---"

  # Alla fine del tuo script prepare-db-for-tests.rb
  puts "--- Checking if fake data already exists ---"

  # Controlla se esistono già dati fake (oltre ai tuoi utenti base)
  existing_users_count = Decidim::User.where(organization: org).count
  existing_processes_count = Decidim::ParticipatoryProcess.where(organization: org).count
  existing_proposals_count = Decidim::Proposals::Proposal.joins(:component)
      .where(component: { participatory_space: { decidim_organization_id: org.id } }).count rescue 0


  puts "--- Current data: #{existing_users_count} users, #{existing_processes_count} processes, #{existing_proposals_count} proposals ---"
  if ENV["RAILS_ENV"] == "development"
    if existing_users_count > 5 && existing_processes_count > 3 && existing_proposals_count > 10
      puts "--- Sufficient data exists, skipping seeds generation ---"
    else
      puts "--- Generating fake data with Decidim seeds is disabled for now ---"
      puts "--- Basic users have been created successfully ---"
      Decidim.seed!
      # Commented out due to compatibility issues with Decidim.current_organization
      # puts "--- Generating fake data with Decidim seeds ---"
      # puts "--- This may take some time... ---"

      # begin
      #   # Set the organization context for seeds
      #   Decidim.current_organization = org
      #   
      #   # Try to seed with better error handling
      #   Decidim.seed!
      #   puts "--- Decidim seeds completed successfully ---"
      # rescue ActiveRecord::RecordInvalid => e
      #   if e.message.include?("User must exist")
      #     puts "--- Decidim.seed! failed due to missing users dependency ---"
      #     puts "--- This is a known issue with Decidim 0.30.1 seeds ---"
      #     puts "--- Create users manually via the web interface first ---"
      #   else
      #     puts "--- Error running Decidim seeds: #{e.message} ---"
      #     puts e.backtrace.first(10).join("\n")
      #   end
      # rescue => e
      #   puts "--- Error running Decidim seeds: #{e.message} ---"
      #   puts e.backtrace.first(10).join("\n")
      # ensure
      #   # Reset organization context
      #   Decidim.current_organization = nil
      # end
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
  end
# Closing the main begin block
end
