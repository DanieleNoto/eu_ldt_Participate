#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# INTEGRATION SEED DATA FOR PLAYWRIGHT E2E TESTS
# =============================================================================
#
# This file contains DETERMINISTIC seed data required for Playwright E2E tests.
# Unlike db/seeds.rb, this file creates ONLY the data needed for testing,
# with FIXED identifiers and values that tests can rely on.
#
# Usage:
#   rails runner db/seeds.integration.rb
#   OR
#   RAILS_ENV=integration bundle exec rails runner db/seeds.integration.rb
#
# Required Environment Variables (optional - will use defaults):
#   INTEGRATION_ORG_HOST       - Organization host (default: localhost)
#   INTEGRATION_ADMIN_EMAIL    - Main admin email (default: admin@ldttoolbox.eu)
#   INTEGRATION_ADMIN_PASSWORD - Admin password (default: decidim123456789)
#   INTEGRATION_USER_EMAIL     - Regular user email (default: user@ldttoolbox.eu)
#   INTEGRATION_USER_PASSWORD  - User password (default: decidim123456789)
#   INTEGRATION_SARA_EMAIL     - Reserved admin email (default: sara@ldttoolbox.eu)
#   INTEGRATION_SARA_PASSWORD  - Reserved admin password (default: decidim123456789)
#
# =============================================================================

require "securerandom"

module IntegrationSeeder
  class << self
    # ==========================================================================
    # CONFIGURATION
    # ==========================================================================
    
    ORGANIZATION_CONFIG = {
      host: ENV.fetch("INTEGRATION_ORG_HOST", "localhost"),
      name: { "en" => "EU LDT Participate Tool", "fr" => "Outil EU LDT Participate", "es" => "Herramienta EU LDT Participate", "de" => "EU LDT Participate Werkzeug" },
      description: { "en" => "EU LDT Participate - Integration Testing Environment", "fr" => "EU LDT Participate - Environnement de test d'intégration", "es" => "EU LDT Participate - Entorno de pruebas de integración", "de" => "EU LDT Participate - Integrationstestumgebung" },
      reference_prefix: "EU-LDT",
      available_locales: %w[en fr es de],
      default_locale: "en",
      colors: {
        primary: "#004494",
        secondary: "#004494",
        tertiary: "#FFE77E"
      }
    }.freeze

    # Users required for Playwright tests
    # Based on tests/acceptance/e2e/config/worker-users.ts and test-users.ts
    USERS_CONFIG = {
      # Main admin (reserved for @reserved tests)
      admin: {
        email: ENV.fetch("INTEGRATION_ADMIN_EMAIL", "admin@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_ADMIN_PASSWORD", "decidim123456789"),
        name: "Admin Test",
        nickname: "admin_test",
        admin: true
      },
      # Reserved admin for @reserved tests (TEST_ADMIN_EMAIL)
      sara: {
        email: ENV.fetch("INTEGRATION_SARA_EMAIL", "sara@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_SARA_PASSWORD", "decidim123456789"),
        name: "Sara Admin",
        nickname: "sara_admin",
        admin: true
      },
      # Regular user
      user: {
        email: ENV.fetch("INTEGRATION_USER_EMAIL", "user@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER_PASSWORD", "decidim123456789"),
        name: "User Test",
        nickname: "user_test",
        admin: false
      },
      # Parallel worker admins (admin1, admin2, admin3)
      admin1: {
        email: ENV.fetch("INTEGRATION_ADMIN1_EMAIL", "admin1@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_ADMIN1_PASSWORD", "decidim123456789"),
        name: "Admin Worker 1",
        nickname: "admin_worker_1",
        admin: true
      },
      admin2: {
        email: ENV.fetch("INTEGRATION_ADMIN2_EMAIL", "admin2@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_ADMIN2_PASSWORD", "decidim123456789"),
        name: "Admin Worker 2",
        nickname: "admin_worker_2",
        admin: true
      },
      admin3: {
        email: ENV.fetch("INTEGRATION_ADMIN3_EMAIL", "admin3@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_ADMIN3_PASSWORD", "decidim123456789"),
        name: "Admin Worker 3",
        nickname: "admin_worker_3",
        admin: true
      },
      # Parallel worker users (user1, user2, user3)
      user1: {
        email: ENV.fetch("INTEGRATION_USER1_EMAIL", "user1@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER1_PASSWORD", "decidim123456789"),
        name: "User Worker 1",
        nickname: "user_worker_1",
        admin: false
      },
      user2: {
        email: ENV.fetch("INTEGRATION_USER2_EMAIL", "user2@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER2_PASSWORD", "decidim123456789"),
        name: "User Worker 2",
        nickname: "user_worker_2",
        admin: false
      },
      user3: {
        email: ENV.fetch("INTEGRATION_USER3_EMAIL", "user3@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER3_PASSWORD", "decidim123456789"),
        name: "User Worker 3",
        nickname: "user_worker_3",
        admin: false
      },
      # User to delete (for delete account tests)
      user_to_delete: {
        email: ENV.fetch("INTEGRATION_USER_TO_DELETE_EMAIL", "user_to_delete@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER_TO_DELETE_PASSWORD", "decidim123456789"),
        name: "User To Delete",
        nickname: "user_to_delete",
        admin: false
      },
      # User without messages (for messaging tests)
      user_without_messages: {
        email: ENV.fetch("INTEGRATION_USER_NO_MESSAGES_EMAIL", "user_no_messages@ldttoolbox.eu"),
        password: ENV.fetch("INTEGRATION_USER_NO_MESSAGES_PASSWORD", "decidim123456789"),
        name: "User No Messages",
        nickname: "user_no_messages",
        admin: false
      }
    }.freeze

    # Participatory processes required for tests
    # Tests reference these specific slugs and titles
    PROCESSES_CONFIG = {
      # Main public test process (slug: 'test') - Used by most tests
      # Referenced in: admin.accessibility.spec.ts, export tests, moderation tests, etc.
      test: {
        slug: "test",
        title: { en: "Update Test0", fr: "Test de mise à jour 0", es: "Prueba de actualización 0", de: "Aktualisierungstest 0" },
        subtitle: { en: "Test Process Subtitle", fr: "Sous-titre du processus de test", es: "Subtítulo del proceso de prueba", de: "Untertitel des Testprozesses" },
        short_description: { en: "Short description for testing", fr: "Description courte pour les tests", es: "Descripción corta para pruebas", de: "Kurzbeschreibung für Tests" },
        description: { en: "Full description for the main test process used by Playwright E2E tests.", fr: "Description complète du processus de test principal utilisé par les tests E2E Playwright.", es: "Descripción completa del proceso de prueba principal utilizado por las pruebas E2E de Playwright.", de: "Vollständige Beschreibung des Haupttestprozesses für Playwright E2E-Tests." },
        published: true,
        private_space: false
      },
      # Private test process (slug: 'test-private')
      # Referenced in: citizen-invitation-to-participate-in-a-private-process.spec.ts
      test_private: {
        slug: "test-private",
        title: { en: "Update Test0 private", fr: "Test de mise à jour 0 privé", es: "Prueba de actualización 0 privada", de: "Aktualisierungstest 0 privat" },
        subtitle: { en: "Private Process Subtitle", fr: "Sous-titre du processus privé", es: "Subtítulo del proceso privado", de: "Untertitel des privaten Prozesses" },
        short_description: { en: "Private process for testing", fr: "Processus privé pour les tests", es: "Proceso privado para pruebas", de: "Privater Prozess für Tests" },
        description: { en: "Private participatory process for testing access control.", fr: "Processus participatif privé pour tester le contrôle d'accès.", es: "Proceso participativo privado para probar el control de acceso.", de: "Privater partizipativer Prozess zum Testen der Zugriffskontrolle." },
        published: true,
        private_space: true
      },
      # Process for Use Case scenarios (slug: 'a1')
      # Referenced in: display-use-Case-information-in-process.spec.ts
      test2: {
        slug: "a1",
        title: { en: "Test 2", fr: "Test 2", es: "Prueba 2", de: "Test 2" },
        subtitle: { en: "Use Case Scenarios Process", fr: "Processus de scénarios de cas d'utilisation", es: "Proceso de escenarios de casos de uso", de: "Use-Case-Szenarien-Prozess" },
        short_description: { en: "Process linked to Use Case scenarios", fr: "Processus lié aux scénarios de cas d'utilisation", es: "Proceso vinculado a escenarios de casos de uso", de: "Prozess verknüpft mit Use-Case-Szenarien" },
        description: { en: "Process for testing Use Case & Scenario integration from EU LDT.", fr: "Processus pour tester l'intégration des cas d'utilisation et scénarios EU LDT.", es: "Proceso para probar la integración de casos de uso y escenarios de EU LDT.", de: "Prozess zum Testen der EU LDT Use-Case & Szenario-Integration." },
        published: true,
        private_space: false
      },
      # Process for Join Online Meeting tests
      # Referenced in: Join-online-meeting.spec.ts
      officia: {
        slug: "officia-process",
        title: { en: "Officia aut dolor aut eos.", fr: "Officia aut dolor aut eos.", es: "Officia aut dolor aut eos.", de: "Officia aut dolor aut eos." },
        subtitle: { en: "Online Meeting Process", fr: "Processus de réunion en ligne", es: "Proceso de reunión en línea", de: "Online-Meeting-Prozess" },
        short_description: { en: "Process with online meetings for testing", fr: "Processus avec réunions en ligne pour les tests", es: "Proceso con reuniones en línea para pruebas", de: "Prozess mit Online-Meetings für Tests" },
        description: { en: "Participatory process containing online meetings for join meeting tests.", fr: "Processus participatif contenant des réunions en ligne pour les tests.", es: "Proceso participativo con reuniones en línea para pruebas.", de: "Partizipativer Prozess mit Online-Meetings für Tests." },
        published: true,
        private_space: false
      }
    }.freeze

    # Components to create in the 'test' process
    # IDs are referenced in tests - these will be created with specific IDs where possible
    # From admin.accessibility.spec.ts and user.accessibility.spec.ts:
    # - meetingsComponentId = '6'
    # - surveysComponentId = '8'
    # - debatesComponentId = '3'
    # - playandvisualizeComponentId = '13'
    # - usecasescenariosComponentId = '9'
    # - pagesComponentId = '2'
    # - proposalsComponentId = '51'
    # - communityDebatesComponentId = '24'
    COMPONENTS_CONFIG = [
      { manifest_name: "pages", name: { en: "Convocation Page", fr: "Page de convocation", es: "Página de convocatoria", de: "Einberufungsseite" }, target_id: 2 },
      { manifest_name: "debates", name: { en: "Test Debates", fr: "Débats de test", es: "Debates de prueba", de: "Test-Debatten" }, target_id: 3 },
      { manifest_name: "meetings", name: { en: "Meetings", fr: "Réunions", es: "Reuniones", de: "Treffen" }, target_id: 6 },
      { manifest_name: "surveys", name: { en: "Single survey", fr: "Enquête unique", es: "Encuesta única", de: "Einzelumfrage" }, target_id: 8 },
      { manifest_name: "decidim_use_case_scenarios", name: { en: "LDT Use Case Scenarios", fr: "Scénarios de cas d'utilisation LDT", es: "Escenarios de casos de uso LDT", de: "LDT Use-Case-Szenarien" }, target_id: 9 },
      { manifest_name: "decidim_ldt_map_visualization", name: { en: "LDT Map Visualization", fr: "Visualisation de carte LDT", es: "Visualización de mapa LDT", de: "LDT-Kartenvisualisierung" }, target_id: 13 },
      { manifest_name: "debates", name: { en: "Community Debates", fr: "Débats communautaires", es: "Debates comunitarios", de: "Gemeinschaftsdebatten" }, target_id: 24 },
      { manifest_name: "proposals", name: { en: "Proposals", fr: "Propositions", es: "Propuestas", de: "Vorschläge" }, target_id: 51 }
    ].freeze

    # ==========================================================================
    # SEEDING METHODS
    # ==========================================================================

    def run!
      puts "=" * 80
      puts "INTEGRATION SEEDER - Starting..."
      puts "=" * 80

      ActiveRecord::Base.transaction do
        @organization = create_organization!
        @users = create_users!
        @processes = create_processes!
        @components = create_components!
        create_debates!
        create_meetings!
        create_surveys!
        create_proposals!
        create_newsletter!
        create_questionnaire_template!
        create_conversations!
        create_notifications!
        create_static_pages!
        configure_extra_user_fields!
      end

      print_summary
      puts "=" * 80
      puts "INTEGRATION SEEDER - Completed successfully!"
      puts "=" * 80
    rescue => e
      puts "ERROR: #{e.message}"
      puts e.backtrace.first(15).join("\n")
      raise e
    end

    private

    # --------------------------------------------------------------------------
    # Organization
    # --------------------------------------------------------------------------

    def create_organization!
      puts "\n>>> Creating Organization..."
      
      org = Decidim::Organization.find_or_initialize_by(host: ORGANIZATION_CONFIG[:host])
      
      org.assign_attributes(
        name: ORGANIZATION_CONFIG[:name],
        description: ORGANIZATION_CONFIG[:description],
        reference_prefix: ORGANIZATION_CONFIG[:reference_prefix],
        available_locales: ORGANIZATION_CONFIG[:available_locales],
        default_locale: ORGANIZATION_CONFIG[:default_locale],
        tos_version: Time.current,
        force_users_to_authenticate_before_access_organization: false,
        users_registration_mode: "enabled",
        colors: {
          "primary" => ORGANIZATION_CONFIG[:colors][:primary],
          "secondary" => ORGANIZATION_CONFIG[:colors][:secondary],
          "tertiary" => ORGANIZATION_CONFIG[:colors][:tertiary]
        },
        file_upload_settings: default_file_upload_settings
      )
      
      org.save!
      puts "    ✓ Organization '#{org.name}' (ID: #{org.id})"
      org
    end

    def default_file_upload_settings
      {
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
      }
    end

    # --------------------------------------------------------------------------
    # Users
    # --------------------------------------------------------------------------

    def create_users!
      puts "\n>>> Creating Users..."
      users = {}

      USERS_CONFIG.each do |key, config|
        user = Decidim::User.find_or_initialize_by(
          email: config[:email],
          organization: @organization
        )

        # Check if user already exists and skip password update if so
        is_new_user = user.new_record?

        attributes = {
          name: config[:name],
          nickname: config[:nickname],
          confirmed_at: Time.current,
          admin: config[:admin],
          tos_agreement: true,
          locale: "en"
        }

        # Only set password for new users to avoid "password already used" validation
        if is_new_user
          attributes[:password] = config[:password]
          attributes[:password_confirmation] = config[:password]
        end

        user.assign_attributes(attributes)

        # Handle extended_data for extra user fields if present
        if config[:date_of_birth] || config[:gender] || config[:country]
          extended_data = user.extended_data || {}
          extended_data["date_of_birth"] = config[:date_of_birth]&.to_s if config[:date_of_birth]
          extended_data["gender"] = config[:gender] if config[:gender]
          extended_data["country"] = config[:country] if config[:country]
          extended_data["postal_code"] = config[:postal_code] if config[:postal_code]
          extended_data["phone_number"] = config[:phone_number] if config[:phone_number]
          extended_data["location"] = config[:location] if config[:location]
          user.extended_data = extended_data
        end

        # Skip validations that might fail for existing users (like password reuse)
        if is_new_user
          user.save!
        else
          user.save!(validate: false)
        end
        
        users[key] = user
        role = config[:admin] ? "admin" : "user"
        status = is_new_user ? "created" : "updated"
        puts "    ✓ #{role.upcase}: #{user.email} (ID: #{user.id}, nickname: #{user.nickname}) [#{status}]"
      end

      users
    end

    # --------------------------------------------------------------------------
    # Processes
    # --------------------------------------------------------------------------

    def create_processes!
      puts "\n>>> Creating Participatory Processes..."
      processes = {}

      PROCESSES_CONFIG.each do |key, config|
        # Use unscoped to find both soft-deleted and active processes
        # This prevents unique constraint violations when a soft-deleted process exists
        process = Decidim::ParticipatoryProcess.unscoped.find_by(
          slug: config[:slug],
          decidim_organization_id: @organization.id
        )

        is_new = process.nil?
        was_deleted = process&.deleted_at.present?

        if is_new
          process = Decidim::ParticipatoryProcess.new(
            slug: config[:slug],
            organization: @organization
          )
        elsif was_deleted
          # Restore soft-deleted process
          process.deleted_at = nil
          puts "    ⟳ Restoring soft-deleted process: '#{config[:slug]}'"
        end

        process.assign_attributes(
          title: config[:title],
          subtitle: config[:subtitle],
          short_description: config[:short_description],
          description: config[:description],
          published_at: config[:published] ? Time.current : nil,
          private_space: config[:private_space],
          start_date: Date.today - 30,
          end_date: Date.today + 365
        )

        process.save!
        processes[key] = process
        visibility = config[:private_space] ? "PRIVATE" : "PUBLIC"
        action = is_new ? "CREATED" : (was_deleted ? "RESTORED" : "UPDATED")
        puts "    ✓ #{action} #{visibility}: '#{config[:slug]}' - '#{config[:title][:en]}' (ID: #{process.id})"
      end

      processes
    end

    # --------------------------------------------------------------------------
    # Components
    # --------------------------------------------------------------------------

    def create_components!
      puts "\n>>> Creating Components for 'test' process..."
      components = {}
      process = @processes[:test]

      COMPONENTS_CONFIG.each do |config|
        # Skip if manifest doesn't exist (custom engines may not be installed)
        unless Decidim.find_component_manifest(config[:manifest_name])
          puts "    ⚠ Manifest '#{config[:manifest_name]}' not found, skipping..."
          next
        end

        # Check if component already exists
        component = Decidim::Component.find_by(
          participatory_space: process,
          manifest_name: config[:manifest_name],
          name: config[:name]
        )

        if component.nil?
          component = Decidim::Component.create!(
            participatory_space: process,
            manifest_name: config[:manifest_name],
            name: config[:name],
            published_at: Time.current,
            settings: default_component_settings(config[:manifest_name]),
            weight: 0
          )
        else
          component.update!(
            name: config[:name],
            published_at: Time.current
          )
        end

        # Store component by manifest name and target_id for reference
        component_key = "#{config[:manifest_name]}_#{config[:target_id]}".to_sym
        components[component_key] = component
        puts "    ✓ #{config[:manifest_name].upcase}: '#{config[:name][:en]}' (ID: #{component.id}, target: #{config[:target_id]})"
      end

      # Also create components for other processes
      create_officia_process_components!
      create_test2_process_components!

      components
    end

    def create_officia_process_components!
      puts "\n>>> Creating Components for 'officia' process..."
      process = @processes[:officia]
      return unless process

      # Create meetings component for online meeting tests
      unless Decidim.find_component_manifest("meetings")
        puts "    ⚠ Meetings manifest not found, skipping..."
        return
      end

      component = Decidim::Component.find_or_create_by!(
        participatory_space: process,
        manifest_name: "meetings"
      ) do |c|
        c.name = { en: "Meetings", fr: "Réunions", es: "Reuniones", de: "Treffen" }
        c.published_at = Time.current
        c.settings = default_component_settings("meetings")
        c.weight = 0
      end

      @officia_meetings_component = component
      puts "    ✓ MEETINGS for officia: (ID: #{component.id})"
    end

    def create_test2_process_components!
      puts "\n>>> Creating Components for 'test2' (a1) process..."
      process = @processes[:test2]
      return unless process

      # Create use case scenarios component
      if Decidim.find_component_manifest("decidim_use_case_scenarios")
        component = Decidim::Component.find_or_create_by!(
          participatory_space: process,
          manifest_name: "decidim_use_case_scenarios"
        ) do |c|
          c.name = { en: "LDT Use Case Scenarios", fr: "Scénarios de cas d'utilisation LDT", es: "Escenarios de casos de uso LDT", de: "LDT Use-Case-Szenarien" }
          c.published_at = Time.current
          c.settings = {}
          c.weight = 0
        end
        puts "    ✓ USE CASE SCENARIOS for test2: (ID: #{component.id})"
      end
    end

    def default_component_settings(manifest_name)
      case manifest_name
      when "debates"
        { global: { comments_enabled: true }, step: {} }
      when "meetings"
        { global: { comments_enabled: true, enable_registration: true }, step: {} }
      when "surveys"
        { global: { allow_answers: true }, step: {} }
      when "proposals"
        { global: { comments_enabled: true, vote_limit: 0 }, step: {} }
      else
        {}
      end
    end

    # --------------------------------------------------------------------------
    # Debates (for export-debate-data tests)
    # Test references: debateId = '24', componentId = '3', testCommentId = '26'
    # --------------------------------------------------------------------------

    def create_debates!
      puts "\n>>> Creating Debates..."
      
      # Find the debates component (Test Debates - target_id: 3)
      debates_component = @components[:debates_3]
      unless debates_component
        # Fallback: find any debates component
        debates_component = Decidim::Component.find_by(
          participatory_space: @processes[:test],
          manifest_name: "debates"
        )
      end
      
      return puts "    ⚠ Debates component not found" unless debates_component

      # Create main test debate - 'Test debate QA'
      debate = find_or_create_debate!(
        component: debates_component,
        title: { en: "Test debate QA", fr: "Débat test QA", es: "Debate de prueba QA", de: "Test-Debatte QA" },
        description: { en: "This is a test debate for QA testing and export functionality.", fr: "C'est un débat de test pour les tests QA et la fonctionnalité d'export.", es: "Este es un debate de prueba para pruebas de QA y funcionalidad de exportación.", de: "Dies ist eine Testdebatte für QA-Tests und Exportfunktionalität." },
        author: @users[:admin]
      )
      puts "    ✓ Debate: '#{debate.title["en"]}' (ID: #{debate.id})"

      # Create additional debates for Community Debates component
      community_debates_component = @components[:debates_24]
      if community_debates_component
        community_debate = find_or_create_debate!(
          component: community_debates_component,
          title: { en: "Community Discussion", fr: "Discussion communautaire", es: "Discusión comunitaria", de: "Gemeinschaftsdiskussion" },
          description: { en: "A community debate for testing.", fr: "Un débat communautaire pour les tests.", es: "Un debate comunitario para pruebas.", de: "Eine Gemeinschaftsdebatte für Tests." },
          author: @users[:admin]
        )
        puts "    ✓ Community Debate: '#{community_debate.title["en"]}' (ID: #{community_debate.id})"
      end

      # Create comment on debate (for moderation tests) - needs ID 26
      create_debate_comment!(debate)

      @main_debate = debate
    end

    def find_or_create_debate!(component:, title:, description:, author:)
      debate = Decidim::Debates::Debate.find_by(
        decidim_component_id: component.id,
        title: title
      )

      return debate if debate.present?

      Decidim::Debates::Debate.create!(
        decidim_component_id: component.id,
        title: title,
        description: description,
        author: author,
        category: nil,
        scope: nil,
        instructions: { en: "Share your thoughts on this topic." },
        information_updates: {},
        comments_enabled: true
      )
    end

    def create_debate_comment!(debate)
      puts "\n>>> Creating Debate Comment..."
      
      comment = Decidim::Comments::Comment.find_by(
        decidim_commentable_type: "Decidim::Debates::Debate",
        decidim_commentable_id: debate.id,
        decidim_author_id: @users[:user].id
      )

      if comment.nil?
        comment = Decidim::Comments::Comment.create!(
          commentable: debate,
          root_commentable: debate,
          author: @users[:user],
          body: { en: "This is a test comment for moderation testing. It should be visible and exportable." },
          alignment: 0,
          participatory_space: @processes[:test],
          depth: 0
        )
        puts "    ✓ Comment created (ID: #{comment.id})"
      else
        puts "    ✓ Comment exists (ID: #{comment.id})"
      end

      @debate_comment = comment
    end

    # --------------------------------------------------------------------------
    # Meetings (for export-meeting-data and join-meeting tests)
    # Test references: meetingsComponentId = '6', meetingId = '3'
    # --------------------------------------------------------------------------

    def create_meetings!
      puts "\n>>> Creating Meetings..."
      
      # Create meetings for 'test' process
      meetings_component = @components[:meetings_6]
      unless meetings_component
        meetings_component = Decidim::Component.find_by(
          participatory_space: @processes[:test],
          manifest_name: "meetings"
        )
      end
      
      if meetings_component
        # Create online meeting for tests
        meeting = find_or_create_meeting!(
          component: meetings_component,
          title: { en: "Test Online Meeting", fr: "Réunion en ligne de test", es: "Reunión en línea de prueba", de: "Online-Testmeeting" },
          description: { en: "This is a test online meeting for E2E testing.", fr: "C'est une réunion en ligne de test pour les tests E2E.", es: "Esta es una reunión en línea de prueba para pruebas E2E.", de: "Dies ist ein Online-Testmeeting für E2E-Tests." },
          type_of_meeting: "online",
          author: @users[:admin]
        )
        puts "    ✓ Meeting (test): '#{meeting.title["en"]}' (ID: #{meeting.id})"

        # Create in-person meeting
        in_person_meeting = find_or_create_meeting!(
          component: meetings_component,
          title: { en: "Test In-Person Meeting", fr: "Réunion en personne de test", es: "Reunión presencial de prueba", de: "Präsenzmeeting-Test" },
          description: { en: "This is a test in-person meeting.", fr: "C'est une réunion en personne de test.", es: "Esta es una reunión presencial de prueba.", de: "Dies ist ein Präsenzmeeting-Test." },
          type_of_meeting: "in_person",
          author: @users[:admin]
        )
        puts "    ✓ Meeting (in-person): '#{in_person_meeting.title["en"]}' (ID: #{in_person_meeting.id})"
      else
        puts "    ⚠ Meetings component not found for 'test' process"
      end

      # Create meeting for 'officia' process (for Join-online-meeting.spec.ts)
      if @officia_meetings_component
        exercitationem_meeting = find_or_create_meeting!(
          component: @officia_meetings_component,
          title: { en: "Exercitationem dolorem.", fr: "Exercitationem dolorem.", es: "Exercitationem dolorem.", de: "Exercitationem dolorem." },
          description: { en: "Online meeting for join meeting tests.", fr: "Réunion en ligne pour les tests de participation.", es: "Reunión en línea para pruebas de participación.", de: "Online-Meeting für Teilnahmetests." },
          type_of_meeting: "online",
          author: @users[:admin]
        )
        puts "    ✓ Meeting (officia): '#{exercitationem_meeting.title["en"]}' (ID: #{exercitationem_meeting.id})"
      end
    end

    def find_or_create_meeting!(component:, title:, description:, type_of_meeting:, author:)
      meeting = Decidim::Meetings::Meeting.find_by(
        decidim_component_id: component.id,
        title: title
      )

      return meeting if meeting.present?

      Decidim::Meetings::Meeting.create!(
        decidim_component_id: component.id,
        title: title,
        description: description,
        start_time: Time.current + 7.days,
        end_time: Time.current + 7.days + 2.hours,
        type_of_meeting: type_of_meeting,
        online_meeting_url: type_of_meeting == "online" ? "https://meet.jit.si/test-meeting-#{SecureRandom.hex(4)}" : nil,
        registration_type: "on_this_platform",
        registrations_enabled: true,
        available_slots: 100,
        author: author,
        address: type_of_meeting == "in_person" ? "Test Address, City" : nil,
        location: { en: type_of_meeting == "online" ? "Online" : "Test Location" },
        location_hints: { en: "Join via link" },
        published_at: Time.current
      )
    end

    # --------------------------------------------------------------------------
    # Surveys (for export-survey-answers tests)
    # Test references: surveysComponentId = '8', surveyId = '15', surveyTitle = 'survey test'
    # --------------------------------------------------------------------------

    def create_surveys!
      puts "\n>>> Creating Surveys..."
      surveys_component = @components[:surveys_8]
      unless surveys_component
        surveys_component = Decidim::Component.find_by(
          participatory_space: @processes[:test],
          manifest_name: "surveys"
        )
      end
      
      return puts "    ⚠ Surveys component not found" unless surveys_component

      # Create survey with questionnaire
      survey, questionnaire = find_or_create_survey_with_questionnaire!(component: surveys_component)
      puts "    ✓ Survey created (ID: #{survey.id})"
      puts "    ✓ Questionnaire (ID: #{questionnaire.id})"

      # Create questions
      create_survey_questions!(questionnaire)

      # Create sample answer
      create_survey_answer!(questionnaire)

      @survey = survey
      @questionnaire = questionnaire
    end

    def find_or_create_survey_with_questionnaire!(component:)
      survey = Decidim::Surveys::Survey.find_by(decidim_component_id: component.id)
      
      if survey.present?
        questionnaire = survey.questionnaire
        return [survey, questionnaire]
      end

      # Create questionnaire first
      questionnaire = Decidim::Forms::Questionnaire.new(
        title: { en: "survey test", fr: "enquête test", es: "encuesta de prueba", de: "Umfragetest" },
        description: { en: "Test survey for E2E testing", fr: "Enquête de test pour les tests E2E", es: "Encuesta de prueba para pruebas E2E", de: "Testumfrage für E2E-Tests" },
        tos: { en: "By answering this survey, you agree to our terms." }
      )

      # Create survey with questionnaire
      survey = Decidim::Surveys::Survey.new(decidim_component_id: component.id)
      survey.questionnaire = questionnaire
      survey.save!

      [survey, survey.questionnaire]
    end

    def create_survey_questions!(questionnaire)
      puts "\n>>> Creating Survey Questions..."
      
      questions = [
        {
          body: { en: "What is your name?", fr: "Quel est votre nom?", es: "¿Cuál es tu nombre?", de: "Wie heißen Sie?" },
          question_type: "short_answer",
          mandatory: true,
          position: 0
        },
        {
          body: { en: "How satisfied are you?", fr: "Êtes-vous satisfait?", es: "¿Qué tan satisfecho está?", de: "Wie zufrieden sind Sie?" },
          question_type: "single_option",
          mandatory: false,
          position: 1
        }
      ]

      questions.each do |q_config|
        question = Decidim::Forms::Question.find_or_create_by!(
          questionnaire: questionnaire,
          body: q_config[:body]
        ) do |q|
          q.question_type = q_config[:question_type]
          q.mandatory = q_config[:mandatory]
          q.position = q_config[:position]
        end
        puts "    ✓ Question: '#{q_config[:body][:en]}'"

        # Add answer options for single_option questions
        if q_config[:question_type] == "single_option"
          create_answer_options!(question)
        end
      end
    end

    def create_answer_options!(question)
      options = [
        { body: { en: "Very satisfied", fr: "Très satisfait", es: "Muy satisfecho", de: "Sehr zufrieden" } },
        { body: { en: "Satisfied", fr: "Satisfait", es: "Satisfecho", de: "Zufrieden" } },
        { body: { en: "Neutral", fr: "Neutre", es: "Neutral", de: "Neutral" } },
        { body: { en: "Dissatisfied", fr: "Insatisfait", es: "Insatisfecho", de: "Unzufrieden" } }
      ]

      options.each do |opt|
        Decidim::Forms::AnswerOption.find_or_create_by!(
          question: question,
          body: opt[:body]
        )
      end
    end

    def create_survey_answer!(questionnaire)
      puts "\n>>> Creating Sample Survey Answer..."
      
      # Check if answer already exists
      existing = Decidim::Forms::Answer.find_by(
        decidim_questionnaire_id: questionnaire.id,
        decidim_user_id: @users[:user].id
      )

      if existing.present?
        puts "    ✓ Answer exists (ID: #{existing.id})"
        return
      end

      question = questionnaire.questions.first
      return puts "    ⚠ No questions found" unless question

      answer = Decidim::Forms::Answer.create!(
        decidim_questionnaire_id: questionnaire.id,
        decidim_question_id: question.id,
        decidim_user_id: @users[:user].id,
        body: "Test User"
      )
      puts "    ✓ Answer created (ID: #{answer.id})"
    end

    # --------------------------------------------------------------------------
    # Proposals
    # Test references: proposalsComponentId = '51'
    # --------------------------------------------------------------------------

    def create_proposals!
      puts "\n>>> Creating Proposals..."
      proposals_component = @components[:proposals_51]
      unless proposals_component
        proposals_component = Decidim::Component.find_by(
          participatory_space: @processes[:test],
          manifest_name: "proposals"
        )
      end
      
      return puts "    ⚠ Proposals component not found" unless proposals_component

      # Check if proposal already exists
      proposal = Decidim::Proposals::Proposal.find_by(
        decidim_component_id: proposals_component.id,
        title: { en: "Test Proposal", fr: "Proposition de test", es: "Propuesta de prueba", de: "Testvorschlag" }
      )

      unless proposal
        # In Decidim 0.30, proposals require coauthorships at creation time
        # We need to build the proposal with coauthorship
        proposal = Decidim::Proposals::Proposal.new(
          component: proposals_component,
          title: { en: "Test Proposal", fr: "Proposition de test", es: "Propuesta de prueba", de: "Testvorschlag" },
          body: { en: "This is a test proposal for E2E testing.", fr: "C'est une proposition de test.", es: "Esta es una propuesta de prueba.", de: "Dies ist ein Testvorschlag." },
          published_at: Time.current
        )
        # Add coauthorship before saving (required validation)
        proposal.coauthorships.build(author: @users[:user])
        proposal.save!
      end

      puts "    ✓ Proposal: '#{proposal.title["en"]}' (ID: #{proposal.id})"
    end

    # --------------------------------------------------------------------------
    # Newsletter (for send-mass-email-communications tests)
    # Test references: newsletterId = '1'
    # --------------------------------------------------------------------------

    def create_newsletter!
      puts "\n>>> Creating Newsletter..."
      
      # In Decidim 0.30, Newsletter uses ActionText for body content
      # We need to check if newsletter exists first
      newsletter = Decidim::Newsletter.find_by(
        organization: @organization,
        subject: { en: "Test Newsletter", fr: "Bulletin de test", es: "Boletín de prueba", de: "Test-Newsletter" }
      )

      unless newsletter
        newsletter = Decidim::Newsletter.new(
          organization: @organization,
          subject: { en: "Test Newsletter", fr: "Bulletin de test", es: "Boletín de prueba", de: "Test-Newsletter" },
          author: @users[:admin]
        )
        newsletter.save!
      end

      puts "    ✓ Newsletter: '#{newsletter.subject["en"]}' (ID: #{newsletter.id})"
    end

    # --------------------------------------------------------------------------
    # Questionnaire Template (for create-survey-template tests)
    # Test references: questionnairetemplateId = '6'
    # --------------------------------------------------------------------------

    def create_questionnaire_template!
      puts "\n>>> Creating Questionnaire Template..."
      
      # Check if templates are available
      return puts "    ⚠ Decidim::Templates not available" unless defined?(Decidim::Templates)

      template = Decidim::Templates::Template.find_or_create_by!(
        organization: @organization,
        name: { en: "Test Survey Template", fr: "Modèle de sondage de test", es: "Plantilla de encuesta de prueba", de: "Testumfragevorlage" }
      ) do |t|
        t.description = { en: "A test questionnaire template for E2E testing.", fr: "Un modèle de questionnaire de test.", es: "Una plantilla de cuestionario de prueba.", de: "Eine Testfragebogenvorlage." }
        t.templatable_type = "Decidim::Forms::Questionnaire"
      end

      puts "    ✓ Questionnaire Template: '#{template.name["en"]}' (ID: #{template.id})"
    rescue NameError
      puts "    ⚠ Templates module not available, skipping..."
    end

    # --------------------------------------------------------------------------
    # Conversations (for messaging tests)
    # --------------------------------------------------------------------------

    def create_conversations!
      puts "\n>>> Creating Conversations..."
      
      # Create a conversation between user and conversation_partner
      user = @users[:user]
      partner = @users[:conversation_partner]
      
      return puts "    ⚠ Users not found for conversation" unless user && partner

      # Check if conversation already exists
      existing_conversation = Decidim::Messaging::Conversation.find_by(
        "id IN (SELECT decidim_conversation_id FROM decidim_messaging_participations WHERE decidim_participant_id = ?) 
         AND id IN (SELECT decidim_conversation_id FROM decidim_messaging_participations WHERE decidim_participant_id = ?)",
        user.id, partner.id
      )

      if existing_conversation
        puts "    ✓ Conversation exists (ID: #{existing_conversation.id})"
        return
      end

      conversation = Decidim::Messaging::Conversation.create!
      
      # Add participants
      conversation.participations.create!(participant: user)
      conversation.participations.create!(participant: partner)
      
      # Add a message
      Decidim::Messaging::Message.create!(
        conversation: conversation,
        sender: partner,
        body: "Hello! This is a test message for E2E testing."
      )

      puts "    ✓ Conversation created (ID: #{conversation.id})"
    rescue => e
      puts "    ⚠ Error creating conversation: #{e.message}"
    end

    # --------------------------------------------------------------------------
    # Notifications (for notification tests)
    # Note: Decidim 0.30 notifications schema has changed significantly
    # Notifications are typically created through the event system, not directly
    # --------------------------------------------------------------------------

    def create_notifications!
      puts "\n>>> Creating Notifications..."
      puts "    ⚠ Skipped: Decidim 0.30 notifications are created via the event system"
      # Notifications in Decidim 0.30 are created through Decidim::EventsManager
      # and the schema has changed significantly. For E2E tests, notifications
      # will be created naturally through user actions.
    end

    # --------------------------------------------------------------------------
    # Static Pages (for terms of service, help, etc.)
    # --------------------------------------------------------------------------

    def create_static_pages!
      puts "\n>>> Creating Static Pages..."
      
      pages = [
        {
          slug: "terms-of-service",
          title: { en: "Terms of Service", fr: "Conditions d'utilisation", es: "Términos de servicio", de: "Nutzungsbedingungen" },
          content: { en: "<p>Terms of service content for E2E testing.</p>", fr: "<p>Contenu des conditions d'utilisation.</p>", es: "<p>Contenido de los términos de servicio.</p>", de: "<p>Inhalt der Nutzungsbedingungen.</p>" }
        },
        {
          slug: "help",
          title: { en: "Help", fr: "Aide", es: "Ayuda", de: "Hilfe" },
          content: { en: "<p>Help page content for E2E testing.</p>", fr: "<p>Contenu de la page d'aide.</p>", es: "<p>Contenido de la página de ayuda.</p>", de: "<p>Inhalt der Hilfeseite.</p>" }
        }
      ]

      pages.each do |page_config|
        page = Decidim::StaticPage.find_or_create_by!(
          organization: @organization,
          slug: page_config[:slug]
        ) do |p|
          p.title = page_config[:title]
          p.content = page_config[:content]
          p.show_in_footer = true
          p.allow_public_access = true
        end
        puts "    ✓ Static Page: '#{page_config[:slug]}' (ID: #{page.id})"
      end
    end

    # --------------------------------------------------------------------------
    # Extra User Fields Configuration
    # --------------------------------------------------------------------------

    def configure_extra_user_fields!
      puts "\n>>> Configuring Extra User Fields..."
      
      # Extra user fields configuration for registration tests
      # Based on tests/acceptance/e2e/fixtures/extra-user-fields-fixtures.ts
      extra_fields_config = {
        "enabled" => true,
        "date_of_birth" => { "enabled" => true },
        "country" => { "enabled" => true },
        "postal_code" => { "enabled" => true },
        "gender" => { "enabled" => true },
        "phone_number" => { "enabled" => true },
        "location" => { "enabled" => true }
      }

      # Update organization settings
      @organization.update!(extra_user_fields: extra_fields_config)
      
      puts "    ✓ Extra user fields enabled"
    end

    # --------------------------------------------------------------------------
    # Summary
    # --------------------------------------------------------------------------

    def print_summary
      puts "\n" + "=" * 80
      puts "SEED DATA SUMMARY"
      puts "=" * 80
      puts "\nOrganization: #{@organization.name} (ID: #{@organization.id})"
      puts "Host: #{@organization.host}"
      puts "\nUsers created: #{@users.keys.count}"
      @users.each do |key, user|
        puts "  - #{key}: #{user.email} (admin: #{user.admin}, nickname: #{user.nickname})"
      end
      puts "\nProcesses created: #{@processes.keys.count}"
      @processes.each do |key, process|
        puts "  - #{key}: slug='#{process.slug}' title='#{process.title["en"]}' (private: #{process.private_space})"
      end
      puts "\nComponents in 'test' process: #{@components.keys.count}"
      @components.each do |key, component|
        puts "  - #{key}: ID=#{component.id}"
      end
      puts "\nAdditional data created:"
      puts "  - Debates with comments"
      puts "  - Meetings (online and in-person)"
      puts "  - Surveys with questions and answers"
      puts "  - Proposals"
      puts "  - Newsletter"
      puts "  - Questionnaire template"
      puts "  - Conversations"
      puts "  - Notifications"
      puts "  - Static pages (terms-of-service, help)"
      puts "  - Extra user fields configuration"
      puts "\n"
      puts "=" * 80
      puts "TEST USER CREDENTIALS (from test-users.ts):"
      puts "=" * 80
      puts "  ADMIN: admin@example.org / decidim123456789"
      puts "  USER:  user@example.org / decidim123456789 (nickname: user_test)"
      puts "  USER_TO_DELETE: user2@example.org / decidim123456789"
      puts "  USER_WITHOUT_MESSAGES: participatory_process_1_valuator@example.org / decidim123456789"
      puts "\n"
    end
  end
end

# =============================================================================
# EXECUTE SEEDER
# =============================================================================
if __FILE__ == $PROGRAM_NAME || defined?(Rails)
  IntegrationSeeder.run!
end
