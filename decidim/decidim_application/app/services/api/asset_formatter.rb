# frozen_string_literal: true

module Api
  class AssetFormatter
    def self.format_assets(assets)
      Rails.logger.debug "Formatting #{assets.size} assets"
      assets.map do |asset|
        composite_id = generate_composite_id(asset[:type], asset[:id])
        Rails.logger.debug "Converting #{asset[:type]} #{asset[:id]} to #{composite_id}"

        {
          id: composite_id,
          type: asset[:type],
          name: asset[:name],
          owner: asset[:owner],
          entity_id: asset[:id],
          created_at: asset[:created_at].iso8601,
          updatedAt: asset[:last_modified].iso8601,
          deleted: asset[:deleted] || false
        }
      end
    end

    def self.generate_composite_id(type, id)
      # Convert type to lowercase and replace spaces/camelCase with dashes
      type_slug = type.gsub(/([a-z])([A-Z])/, '\1-\2').downcase
      "#{type_slug}-#{id}"
    end

    def self.parse_composite_id(composite_id)
      # Find the last dash to separate type from id
      last_dash_index = composite_id.rindex('-')
      return nil unless last_dash_index

      type_slug = composite_id[0...last_dash_index]
      id_str = composite_id[last_dash_index + 1..-1]

      id = id_str.to_i
      return nil if id.zero? # Invalid if id is 0 or not a number

      # Convert slug back to type - handle both formats: with and without internal dashes
      # First try the exact match, then try removing dashes
      type = case type_slug
             when 'meeting' then 'Meeting'
             when 'proposal' then 'Proposal'
             when 'participatoryprocess' then 'ParticipatoryProcess'
             when 'assembly' then 'Assembly'
             when 'conference' then 'Conference'
             when 'debate' then 'Debate'
             when 'initiative' then 'Initiative'
             when 'survey' then 'Survey'
             when 'mapvisualization' then 'MapVisualization'
             when 'use-case-scenario' then 'UseCaseScenario'
             when 'participatory-process' then 'ParticipatoryProcess' # Handle dash format
             else nil
             end

      [type, id] if type
    end

    def self.find_asset_by_composite_id(composite_id, organization)
      Rails.logger.info "Finding asset by composite_id: #{composite_id}"
      type, id = parse_composite_id(composite_id)
      Rails.logger.info "Parsed type: #{type}, id: #{id}"
      return nil unless type && id

      # Map type to model class
      model_class = case type
                    when 'ParticipatoryProcess' then Decidim::ParticipatoryProcess
                    when 'Assembly' then Decidim::Assembly
                    when 'Meeting' then Decidim::Meetings::Meeting
                    when 'Proposal' then Decidim::Proposals::Proposal
                    when 'Survey' then Decidim::Surveys::Survey
                    when 'Conference' then Decidim::Conference
                    when 'Debate' then Decidim::Debates::Debate
                    when 'Initiative' then Decidim::Initiative
                    when 'MapVisualization' then Decidim::LdtMapVisualization::MapVisualization
                    when 'UseCaseScenario' then Decidim::LdtUseCaseScenarios::UseCaseScenario
                    else nil
                    end

      Rails.logger.info "Model class: #{model_class}"
      return nil unless model_class

      # Find record filtered by organization if the model belongs to an organization
      if model_class.column_names.include?('decidim_organization_id')
        record = model_class.find_by(id: id, decidim_organization_id: organization.id)
        Rails.logger.info "Found record for organization #{organization.id}: #{record.inspect}"
      else
        record = model_class.find_by(id: id)
        Rails.logger.info "Found record (no organization filter): #{record.inspect}"
      end

      format_asset_from_record(record) if record
    end

    def self.format_asset_from_record(record)
      type = case record.class.name
             when 'Decidim::ParticipatoryProcess' then 'ParticipatoryProcess'
             when 'Decidim::Assembly' then 'Assembly'
             when 'Decidim::Meetings::Meeting' then 'Meeting'
             when 'Decidim::Proposals::Proposal' then 'Proposal'
             when 'Decidim::Surveys::Survey' then 'Survey'
             when 'Decidim::Conference' then 'Conference'
             when 'Decidim::Debates::Debate' then 'Debate'
             when 'Decidim::Initiative' then 'Initiative'
             when 'Decidim::LdtMapVisualization::MapVisualization' then 'MapVisualization'
             when 'Decidim::LdtUseCaseScenario::UseCaseScenario' then 'UseCaseScenario'
             else record.class.name.split('::').last
             end

      {
        id: generate_composite_id(type, record.id),
        entity_id: record.id,
        type: type,
        name: extract_name(record),
        owner: extract_owner(record),
        created_at: record.created_at.iso8601,
        updatedAt: record.updated_at.iso8601,
        deleted: record.respond_to?(:deleted_at) ? record.deleted_at.present? : false,
        lineage: build_lineage(record),
        changes: []  # TODO: Implement change history
      }
    end

    private

    def self.extract_name(record)
      case record
      when Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative
        record.title[I18n.locale.to_s] || record.title['en']
      when Decidim::Meetings::Meeting, Decidim::Debates::Debate
        record.title[I18n.locale.to_s] || record.title['en']
      when Decidim::Proposals::Proposal
        record.title
      when Decidim::Surveys::Survey
        record.title[I18n.locale.to_s] || record.title['en']
      when Decidim::LdtMapVisualization::MapVisualization, Decidim::LdtUseCaseScenarios::UseCaseScenario
        record.name
      else
        record.title || record.name || "Asset #{record.id}"
      end
    end

    def self.build_lineage(record)
      lineage = []

      case record
      when Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference
        # Questi sono spazi partecipativi di primo livello, non hanno genitori
        lineage
      when Decidim::Initiative
        # Le iniziative sono direttamente sotto l'organizzazione
        lineage
      when Decidim::Meetings::Meeting, Decidim::Proposals::Proposal, Decidim::Surveys::Survey, Decidim::Debates::Debate,
           Decidim::LdtMapVisualization::MapVisualization, Decidim::LdtUseCaseScenarios::UseCaseScenario
        # Questi hanno un component che punta a uno participatory_space
        if record.component&.participatory_space
          space = record.component.participatory_space
          lineage << build_lineage_item(space, 'parent')
        end
        lineage
      else
        lineage
      end
    end

    def self.build_lineage_item(record, relationship)
      type = case record.class.name
             when 'Decidim::ParticipatoryProcess' then 'ParticipatoryProcess'
             when 'Decidim::Assembly' then 'Assembly'
             when 'Decidim::Conference' then 'Conference'
             when 'Decidim::Initiative' then 'Initiative'
             else record.class.name.split('::').last
             end

      {
        id: generate_composite_id(type, record.id),
        type: type,
        name: extract_name(record),
        relationship: relationship
      }
    end

    def self.extract_owner(record)
      case record
      when Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative
        record.decidim_organization_id
      when Decidim::Meetings::Meeting, Decidim::Proposals::Proposal, Decidim::Surveys::Survey, Decidim::Debates::Debate
        record.component&.participatory_space&.decidim_organization_id
      when Decidim::LdtMapVisualization::MapVisualization, Decidim::LdtUseCaseScenarios::UseCaseScenario
        record.component&.participatory_space&.decidim_organization_id
      else
        nil
      end
    end
  end
end