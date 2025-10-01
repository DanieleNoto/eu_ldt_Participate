#!/usr/bin/env ruby
# frozen_string_literal: true

# Configuration from environment variables with defaults
# Set organization details
def organization_config
  {
    name: ENV["SYSTEM_ORG_NAME"] || "EU LDT Participate Tool",
    desc: ENV["SYSTEM_ORG_DESC"] || "EU LDT Participate Tool - Citizen Participation Platform",
    host: ENV["SYSTEM_ORG_HOST"] || "localhost",
    reference_prefix: ENV["SYSTEM_ORG_PREFIX"] || "EU-LDT",
    colors: {
      primary: ENV["SYSTEM_ORG_COLOR_PRIMARY"] || "#004494",
      secondary: ENV["SYSTEM_ORG_COLOR_SECONDARY"] || "#004494",
      tertiary: ENV["SYSTEM_ORG_COLOR_TERTIARY"] || "#FFE77E"
    }
  }
end

# Create or update the organization
def create_organization
  puts "--- Creating organization ---"
  config = organization_config
  
  org = Decidim::Organization.find_or_create_by!(host: config[:host]) do |o|
    # Minimal attributes: keep only those from ENV and essentials
    o.name = { "en" => config[:name] }
    o.reference_prefix = config[:reference_prefix]
    # Available locales required by user: English, French, Spanish, German
    o.available_locales = %w[en fr es de]
    o.description = { "en" => config[:desc] }
    o.default_locale = "en"
    o.tos_version = Time.current
    o.force_users_to_authenticate_before_access_organization = false
    o.users_registration_mode = "enabled"
  end

  # Update colors after organization is created
  if org.persisted?
    org.update!(
      colors: {
        "primary" => config[:colors][:primary],
        "secondary" => config[:colors][:secondary],
        "tertiary" => config[:colors][:tertiary]
      }
    )
  end
  
  puts "--- Organization #{config[:name]} created successfully with ID: #{org.id} ---"
  org
rescue => e
  puts "--- Error creating organization: #{e.message} ---"
  if e.respond_to?(:record) && e.record.respond_to?(:errors)
    puts "--- Validation errors: #{e.record.errors.full_messages} ---"
  end
  raise e
end

# Create basic users for the organization
def create_basic_users(org)
  puts "--- Creating basic users ---"
  
  users = {}
  
  # Only create users in development environment
  # In production, system user should be created manually via rake task with secure credentials
  if (defined?(Rails) && Rails.env.development?) || ENV["RAILS_ENV"] == "development"
    # Create system admin user (for /system access)
    puts "--- Creating system user... ---"
    users[:system] = Decidim::User.find_or_create_by!(
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
    puts "--- System user created: #{users[:system].email} ---"

    # Add system user as system admin
    if defined?(Decidim::System::Admin)
      Decidim::System::Admin.find_or_create_by!(user: users[:system])
    elsif ActiveRecord::Base.connection.table_exists?(:decidim_system_admins)
      # Direct fallback if constant isn't loaded
      system_admins = ActiveRecord::Base.connection.execute("SELECT * FROM decidim_system_admins WHERE user_id = #{users[:system].id}")
      if system_admins.none?
        ActiveRecord::Base.connection.execute("INSERT INTO decidim_system_admins (user_id, created_at, updated_at) VALUES (#{users[:system].id}, '#{Time.now.utc.to_s(:db)}', '#{Time.now.utc.to_s(:db)}')")
      end
    end
    # Create organization admin user
    puts "--- Creating admin user... ---"
    users[:admin] = Decidim::User.find_or_create_by!(
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
    puts "--- Admin user created: #{users[:admin].email} ---"

    # Create regular user
    puts "--- Creating regular user... ---"
    users[:regular] = Decidim::User.find_or_create_by!(
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
    puts "--- Regular user created: #{users[:regular].email} ---"
  else
    puts "--- Production mode: Only system user created for /system access ---"
  end
  
  users
rescue => e
  puts "--- Error creating basic users: #{e.message} ---"
  if e.respond_to?(:record) && e.record.respond_to?(:errors)
    puts "--- Validation errors: #{e.record.errors.full_messages} ---"
  end
  {}
end

# Check if fake data already exists
def check_existing_data(org)
  puts "--- Checking if fake data already exists ---"

  # Check if fake data already exists (beyond basic users)
  {
    users: Decidim::User.where(organization: org).count,
    processes: Decidim::ParticipatoryProcess.where(organization: org).count,
    proposals: begin
                Decidim::Proposals::Proposal.joins(:component)
                  .where(component: { participatory_space: { decidim_organization_id: org.id } }).count
              rescue
                0
              end
  }
end

# Generate fake data if needed
def generate_fake_data(org)
  return unless ENV["RAILS_ENV"] == "development"
  
  existing = check_existing_data(org)
  puts "--- Current data: #{existing[:users]} users, #{existing[:processes]} processes, #{existing[:proposals]} proposals ---"
  
  if existing[:users] > 5 && existing[:processes] > 3 && existing[:proposals] > 10
    puts "--- Sufficient data exists, skipping seeds generation ---"
    return
  end
  
  puts "--- Generating fake data with Decidim seeds ---"
  begin
    Decidim.seed!
  rescue => e
    puts "--- Error running Decidim seeds: #{e.message} ---"
    puts e.backtrace.first(10).join("\n")
  ensure
    # Reset organization context
    Decidim.current_organization = nil if defined?(Decidim.current_organization)
  end
end

# Create user moderation and report
def create_user_moderation(user_to_moderate, reporter_user)
  user_moderation = Decidim::UserModeration.find_or_create_by(
    decidim_user_id: user_to_moderate.id
  ) do |um|
    um.report_count = 0
  end
  
  Decidim::UserReport.find_or_create_by(
    user_moderation_id: user_moderation.id,
    user_id: reporter_user.id
  ) do |ur|
    ur.reason = "spam"
    ur.details = "Test user report generated by seeds"
  end
end

# Create proposal moderations and reports
def create_proposal_moderations(proposals, process, users)
  proposals.each_with_index do |proposal, index|
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
    Decidim::Report.find_or_create_by(
      decidim_moderation_id: moderation.id,
      decidim_user_id: users.sample.id
    ) do |r|
      r.reason = ["spam", "offensive", "irrelevant"].sample
      r.details = "Test report #{index + 1} generated by seeds"
      r.locale = "en"
    end
  end
end

# Create comment moderations and reports
def create_comment_moderations(comments, process, users)
  comments.each_with_index do |comment, index|
    moderation = Decidim::Moderation.find_or_create_by(
      decidim_participatory_space_id: process.id,
      decidim_reportable_type: "Decidim::Comments::Comment",
      decidim_reportable_id: comment.id,
      decidim_participatory_space_type: "Decidim::ParticipatoryProcess"
    ) do |m|
      m.report_count = 1
      m.reported_content = "#{comment.author.name}\n#{comment.body['en'] || comment.body.values.first}"
    end
    
    # Create report
    Decidim::Report.find_or_create_by(
      decidim_moderation_id: moderation.id,
      decidim_user_id: users.sample.id
    ) do |r|
      r.reason = ["spam", "offensive"].sample
      r.details = "Test comment report #{index + 1} generated by seeds"
      r.locale = "en"
    end
  end
end

# Generate moderation test data
def generate_moderation_test_data(org)
  return unless ENV["RAILS_ENV"] == "development"
  
  puts "--- Generating moderation test data ---"
  
  # Get necessary records
  users = Decidim::User.where(organization: org).limit(10)
  processes = Decidim::ParticipatoryProcess.where(organization: org).limit(5)
  components = Decidim::Component.where(participatory_space: processes, manifest_name: "proposals")
  proposals = Decidim::Proposals::Proposal.where(component: components).limit(10)
  
  return puts "--- Warning: Not enough data to create moderation samples ---" unless users.any? && processes.any? && proposals.any?
  
  # Generate user moderation
  create_user_moderation(users.first, users.second || users.first)
  
  # Generate proposal moderations
  create_proposal_moderations(proposals.limit(3), processes.first, users)
  
  # Generate comment moderations
  proposal_ids = proposals.pluck(:id)
  comments = Decidim::Comments::Comment.where(
    decidim_commentable_type: "Decidim::Proposals::Proposal", 
    decidim_commentable_id: proposal_ids
  ).limit(10)
  
  if comments.any?
    create_comment_moderations(comments.limit(2), processes.first, users)
  end
  
  puts "--- Moderation test data generated successfully ---"
rescue => e
  puts "--- Error generating moderation test data: #{e.message} ---"
end

# MAIN EXECUTION FLOW
puts "--- Starting data preparation ---"

begin
  # Create or update organization
  org = create_organization()

  # Create basic users
  users = create_basic_users(org)
  puts "--- Basic data preparation completed successfully ---"

  # Generate fake data
  generate_fake_data(org)
  
  # Generate moderation test data
  generate_moderation_test_data(org)
  
  puts "--- Data preparation completed successfully ---"
rescue => e
  puts "--- Error during data preparation: #{e.message} ---"
  puts e.backtrace.first(10).join("\n")
  raise e
end
