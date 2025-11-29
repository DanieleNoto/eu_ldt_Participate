# frozen_string_literal: true

# =============================================================================
# INTEGRATION SEED TASKS FOR PLAYWRIGHT E2E TESTS
# =============================================================================
#
# Usage:
#   bundle exec rake integration:seed                    # Run all integration seeds
#   bundle exec rake integration:seed:reset              # Reset and reseed
#   bundle exec rake integration:seed:verify             # Verify seed data exists
#   bundle exec rake integration:seed:users              # Seed only users
#   bundle exec rake integration:seed:processes          # Seed only processes
#
# CI/CD Pipeline Integration:
#   Before Playwright tests, run:
#   docker-compose exec decidim bundle exec rake integration:seed
#
# =============================================================================

namespace :integration do
  namespace :seed do
    desc "Run integration seeds for Playwright E2E tests"
    task all: :environment do
      puts "Running Integration Seeds..."
      load Rails.root.join("db", "seeds.integration.rb")
    end

    desc "Reset and reseed integration data (WARNING: destroys existing test data)"
    task reset: :environment do
      puts "=" * 80
      puts "WARNING: This will delete existing integration test data!"
      puts "=" * 80
      
      Rake::Task["integration:seed:clean"].invoke
      Rake::Task["integration:seed:all"].invoke
    end

    desc "Clean integration test data"
    task clean: :environment do
      puts "Cleaning integration test data..."
      
      # Find organization
      org = Decidim::Organization.find_by(host: ENV.fetch("INTEGRATION_ORG_HOST", "localhost"))
      unless org
        puts "  No organization found to clean"
        return
      end

      # Clean processes with test slugs
      test_slugs = %w[test test-private a1 officia-process]
      processes = Decidim::ParticipatoryProcess.where(organization: org, slug: test_slugs)
      
      processes.each do |process|
        puts "  Cleaning process: #{process.slug}"
        
        # Clean components and their content
        process.components.each do |component|
          puts "    - Cleaning component: #{component.manifest_name}"
          begin
            case component.manifest_name
            when "debates"
              # First clean comments on debates
              debates = Decidim::Debates::Debate.where(decidim_component_id: component.id)
              debates.each do |debate|
                Decidim::Comments::Comment.where(
                  decidim_commentable_type: "Decidim::Debates::Debate",
                  decidim_commentable_id: debate.id
                ).destroy_all
              end
              debates.destroy_all
            when "meetings"
              meetings = Decidim::Meetings::Meeting.where(decidim_component_id: component.id)
              meetings.each do |meeting|
                # Clean registrations
                Decidim::Meetings::Registration.where(decidim_meeting_id: meeting.id).destroy_all if defined?(Decidim::Meetings::Registration)
                # Clean comments
                Decidim::Comments::Comment.where(
                  decidim_commentable_type: "Decidim::Meetings::Meeting",
                  decidim_commentable_id: meeting.id
                ).destroy_all
              end
              meetings.destroy_all
            when "surveys"
              surveys = Decidim::Surveys::Survey.where(decidim_component_id: component.id)
              surveys.each do |survey|
                questionnaire = survey.questionnaire
                if questionnaire
                  Decidim::Forms::Answer.where(decidim_questionnaire_id: questionnaire.id).destroy_all
                  questionnaire.questions.each do |question|
                    Decidim::Forms::AnswerOption.where(decidim_question_id: question.id).destroy_all
                  end
                  Decidim::Forms::Question.where(decidim_questionnaire_id: questionnaire.id).destroy_all
                end
              end
              surveys.destroy_all
            when "proposals"
              proposals = Decidim::Proposals::Proposal.where(decidim_component_id: component.id)
              proposals.each do |proposal|
                # Clean coauthorships
                Decidim::Coauthorship.where(coauthorable: proposal).destroy_all
                # Clean comments
                Decidim::Comments::Comment.where(
                  decidim_commentable_type: "Decidim::Proposals::Proposal",
                  decidim_commentable_id: proposal.id
                ).destroy_all
              end
              proposals.destroy_all
            end
            component.destroy
          rescue => e
            puts "      Warning: Could not fully clean #{component.manifest_name}: #{e.message}"
            # Try to just destroy the component anyway
            component.destroy rescue nil
          end
        end
        
        process.destroy rescue puts "      Warning: Could not destroy process #{process.slug}"
      end

      # Clean test users - be careful with foreign keys
      test_emails = %w[
        admin@ldttoolbox.eu sara@ldttoolbox.eu user@ldttoolbox.eu
        admin1@ldttoolbox.eu admin2@ldttoolbox.eu admin3@ldttoolbox.eu
        user1@ldttoolbox.eu user2@ldttoolbox.eu user3@ldttoolbox.eu
        user_to_delete@ldttoolbox.eu user_no_messages@ldttoolbox.eu
        john.doe@example.org jane.doe@example.org mario.rossi@example.org
        anna.bianchi@example.org conversation_partner@ldttoolbox.eu
      ]
      
      test_emails.each do |email|
        user = Decidim::User.find_by(organization: org, email: email)
        next unless user
        
        begin
          # Clean related data that might have foreign key constraints
          puts "    Cleaning user: #{email}"
          
          # Clean editor images
          if defined?(Decidim::EditorImage)
            Decidim::EditorImage.where(decidim_author_id: user.id).destroy_all
          end
          
          # Clean notifications
          Decidim::Notification.where(user: user).destroy_all
          
          # Clean follows
          Decidim::Follow.where(user: user).destroy_all
          
          # Clean messaging participations and messages
          if defined?(Decidim::Messaging::Participation)
            participations = Decidim::Messaging::Participation.where(decidim_participant_id: user.id)
            participations.each do |p|
              # Delete messages sent by this user in the conversation
              Decidim::Messaging::Message.where(decidim_conversation_id: p.decidim_conversation_id, decidim_sender_id: user.id).destroy_all
            end
            participations.destroy_all
          end
          
          # Clean coauthorships
          Decidim::Coauthorship.where(author: user).destroy_all
          
          # Clean action logs
          Decidim::ActionLog.where(user: user).destroy_all
          
          # Finally destroy the user
          user.destroy
          puts "    ✓ Cleaned user: #{email}"
        rescue => e
          puts "    Warning: Could not fully clean user #{email}: #{e.message}"
          # Try direct SQL as last resort
          begin
            ActiveRecord::Base.connection.execute("DELETE FROM decidim_users WHERE id = #{user.id}")
            puts "    ✓ Force deleted user: #{email}"
          rescue => e2
            puts "    Error: Could not delete user #{email}: #{e2.message}"
          end
        end
      end
      
      # Clean newsletters
      Decidim::Newsletter.where(organization: org).destroy_all rescue nil
      
      # Clean templates
      if defined?(Decidim::Templates::Template)
        Decidim::Templates::Template.where(organization: org).destroy_all rescue nil
      end
      
      puts "Clean completed!"
    end

    desc "Verify integration seed data exists"
    task verify: :environment do
      puts "=" * 80
      puts "VERIFYING INTEGRATION SEED DATA"
      puts "=" * 80
      
      errors = []
      
      # Check organization
      org = Decidim::Organization.find_by(host: ENV.fetch("INTEGRATION_ORG_HOST", "localhost"))
      if org
        puts "✓ Organization found: #{org.name} (ID: #{org.id})"
      else
        errors << "✗ Organization not found"
      end

      # Check users
      required_users = %w[admin@ldttoolbox.eu sara@ldttoolbox.eu user@ldttoolbox.eu]
      required_users.each do |email|
        user = Decidim::User.find_by(email: email, organization: org)
        if user
          puts "✓ User: #{email} (admin: #{user.admin})"
        else
          errors << "✗ User not found: #{email}"
        end
      end

      # Check processes
      %w[test test-private].each do |slug|
        process = Decidim::ParticipatoryProcess.find_by(slug: slug, organization: org)
        if process
          puts "✓ Process: #{slug} (published: #{process.published?})"
        else
          errors << "✗ Process not found: #{slug}"
        end
      end

      # Check components in 'test' process
      test_process = Decidim::ParticipatoryProcess.find_by(slug: "test", organization: org)
      if test_process
        %w[debates meetings surveys proposals pages].each do |manifest|
          component = Decidim::Component.find_by(participatory_space: test_process, manifest_name: manifest)
          if component
            puts "✓ Component: #{manifest} (ID: #{component.id})"
          else
            errors << "✗ Component not found: #{manifest}"
          end
        end
      end

      # Summary
      puts "\n" + "=" * 80
      if errors.empty?
        puts "ALL CHECKS PASSED ✓"
      else
        puts "ERRORS FOUND:"
        errors.each { |e| puts "  #{e}" }
        exit 1
      end
      puts "=" * 80
    end

    desc "Seed only users (without processes)"
    task users: :environment do
      puts "Seeding integration users..."
      
      org = Decidim::Organization.find_by(host: ENV.fetch("INTEGRATION_ORG_HOST", "localhost"))
      raise "Organization not found!" unless org

      users_config = {
        admin: { email: "admin@ldttoolbox.eu", name: "Admin Test", nickname: "admin_test", admin: true },
        sara: { email: "sara@ldttoolbox.eu", name: "Sara Admin", nickname: "sara_admin", admin: true },
        user: { email: "user@ldttoolbox.eu", name: "User Test", nickname: "user_test", admin: false }
      }

      users_config.each do |key, config|
        user = Decidim::User.find_or_initialize_by(email: config[:email], organization: org)
        user.assign_attributes(
          name: config[:name],
          nickname: config[:nickname],
          password: "decidim123456789",
          password_confirmation: "decidim123456789",
          confirmed_at: Time.current,
          admin: config[:admin],
          tos_agreement: true
        )
        user.save!
        puts "  ✓ #{key}: #{config[:email]}"
      end
    end

    desc "Seed only processes (requires users to exist)"
    task processes: :environment do
      puts "Seeding integration processes..."
      
      org = Decidim::Organization.find_by(host: ENV.fetch("INTEGRATION_ORG_HOST", "localhost"))
      raise "Organization not found!" unless org

      processes_config = {
        test: { slug: "test", title: { en: "Update Test0" }, private_space: false },
        test_private: { slug: "test-private", title: { en: "Update Test0 private" }, private_space: true }
      }

      processes_config.each do |key, config|
        process = Decidim::ParticipatoryProcess.find_or_initialize_by(slug: config[:slug], organization: org)
        process.assign_attributes(
          title: config[:title],
          subtitle: { en: "Subtitle" },
          short_description: { en: "Short description" },
          description: { en: "Full description" },
          published_at: Time.current,
          private_space: config[:private_space],
          start_date: Date.today - 30,
          end_date: Date.today + 365
        )
        process.save!
        puts "  ✓ #{key}: #{config[:slug]}"
      end
    end
  end

  # Shortcut task
  desc "Run integration seeds (alias for integration:seed:all)"
  task seed: "seed:all"
end
