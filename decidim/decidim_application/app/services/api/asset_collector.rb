# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Gianfranco Cedro
# frozen_string_literal: true



module Api
  class AssetCollector
    def initialize(organization)
      @organization = organization
    end

    def collect_all
      assets = []

      # Collect all Decidim entities
      assets.concat(collect_participatory_processes)
      assets.concat(collect_assemblies)
      assets.concat(collect_meetings)
      assets.concat(collect_proposals)
      assets.concat(collect_surveys)
      assets.concat(collect_conferences)
      assets.concat(collect_debates)
      assets.concat(collect_initiatives)
      assets.concat(collect_map_visualizations)
      assets.concat(collect_use_case_scenarios)

      # Sort by created_at descending
      assets.sort_by { |asset| asset[:created_at] }.reverse
    end

    private

    def collect_participatory_processes
      Decidim::ParticipatoryProcess.where(organization: @organization).map do |process|
        # Skip processes with missing title
        next if process.title.nil?
        
        {
          id: process.id,
          name: process.title[I18n.locale.to_s] || process.title['en'] || process.title.values.first,
          type: 'ParticipatoryProcess',
          owner: process.decidim_organization_id,
          created_at: process.created_at,
          last_modified: process.updated_at,
          deleted: process.deleted_at.present?,
          entity: process
        }
      end.compact
    end

    def collect_assemblies
      Decidim::Assembly.where(organization: @organization).map do |assembly|
        # Skip assemblies with missing title
        next if assembly.title.nil?
        
        {
          id: assembly.id,
          name: assembly.title[I18n.locale.to_s] || assembly.title['en'] || assembly.title.values.first,
          type: 'Assembly',
          owner: assembly.decidim_organization_id,
          created_at: assembly.created_at,
          last_modified: assembly.updated_at,
          deleted: assembly.deleted_at.present?,
          entity: assembly
        }
      end.compact
    end

    def collect_meetings
      # Simplified version - get all meetings from current organization spaces
      meetings = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        meetings += Decidim::Meetings::Meeting.joins(:component)
          .where(component: { participatory_space_type: space_class.name, participatory_space_id: space_ids })
          .to_a
      end

      meetings.map do |meeting|
        # Skip meetings with missing component or title
        next if meeting.component.nil? || meeting.title.nil?
        
        {
          id: meeting.id,
          name: meeting.title[I18n.locale.to_s] || meeting.title['en'] || meeting.title.values.first,
          type: 'Meeting',
          owner: meeting.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: meeting.created_at,
          last_modified: meeting.updated_at,
          deleted: meeting.deleted_at.present?,
          entity: meeting
        }
      end.compact
    end

    def collect_proposals
      # Simplified version
      proposals = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        proposals += Decidim::Proposals::Proposal.joins(:component)
          .where(component: { participatory_space_type: space_class.name, participatory_space_id: space_ids })
          .to_a
      end

      proposals.map do |proposal|
        # Skip proposals with missing component
        next if proposal.component.nil?
        
        {
          id: proposal.id,
          name: proposal.title,
          type: 'Proposal',
          owner: proposal.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: proposal.created_at,
          last_modified: proposal.updated_at,
          deleted: proposal.deleted_at.present?,
          entity: proposal
        }
      end.compact
    end

    def collect_surveys
      surveys = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        surveys += Decidim::Surveys::Survey.joins(:component)
          .where(component: { participatory_space_type: space_class.name, participatory_space_id: space_ids })
          .to_a
      end

      surveys.map do |survey|
        # Skip surveys with missing component or title data
        next if survey.component.nil? || survey.title.nil?
        
        {
          id: survey.id,
          name: survey.title[I18n.locale.to_s] || survey.title['en'] || survey.title.values.first,
          type: 'Survey',
          owner: survey.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: survey.created_at,
          last_modified: survey.updated_at,
          deleted: survey.deleted_at.present?,
          entity: survey
        }
      end.compact
    end

    def collect_conferences
      Decidim::Conference.where(organization: @organization).map do |conference|
        # Skip conferences with missing title
        next if conference.title.nil?
        
        {
          id: conference.id,
          name: conference.title[I18n.locale.to_s] || conference.title['en'] || conference.title.values.first,
          type: 'Conference',
          owner: conference.decidim_organization_id,
          created_at: conference.created_at,
          last_modified: conference.updated_at,
          deleted: conference.deleted_at.present?,
          entity: conference
        }
      end.compact
    end

    def collect_debates
      debates = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        debates += Decidim::Debates::Debate.joins(:component)
          .where(component: { participatory_space_type: space_class.name, participatory_space_id: space_ids })
          .to_a
      end

      debates.map do |debate|
        # Skip debates with missing component or title
        next if debate.component.nil? || debate.title.nil?
        
        {
          id: debate.id,
          name: debate.title[I18n.locale.to_s] || debate.title['en'] || debate.title.values.first,
          type: 'Debate',
          owner: debate.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: debate.created_at,
          last_modified: debate.updated_at,
          deleted: debate.deleted_at.present?,
          entity: debate
        }
      end.compact
    end

    def collect_initiatives
      Decidim::Initiative.where(organization: @organization).map do |initiative|
        # Skip initiatives with missing title
        next if initiative.title.nil?
        
        {
          id: initiative.id,
          name: initiative.title[I18n.locale.to_s] || initiative.title['en'] || initiative.title.values.first,
          type: 'Initiative',
          owner: initiative.decidim_organization_id,
          created_at: initiative.created_at,
          last_modified: initiative.updated_at,
          deleted: initiative.respond_to?(:deleted_at) ? initiative.deleted_at.present? : false,
          entity: initiative
        }
      end.compact
    end

    def collect_map_visualizations
      # Get all component IDs that belong to participatory spaces of the current organization
      component_ids = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        component_ids += Decidim::Component.where(participatory_space_type: space_class.name, participatory_space_id: space_ids).pluck(:id)
      end

      Decidim::LdtMapVisualization::MapVisualization.where(decidim_component_id: component_ids).map do |map_visualization|
        # Skip map visualizations with missing component
        next if map_visualization.component.nil?
        
        {
          id: map_visualization.id,
          name: map_visualization.name,
          type: 'MapVisualization',
          owner: map_visualization.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: map_visualization.created_at,
          last_modified: map_visualization.updated_at,
          deleted: map_visualization.respond_to?(:deleted_at) ? map_visualization.deleted_at.present? : false,
          entity: map_visualization
        }
      end.compact
    end

    def collect_use_case_scenarios
      # Get all component IDs that belong to participatory spaces of the current organization
      component_ids = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        component_ids += Decidim::Component.where(participatory_space_type: space_class.name, participatory_space_id: space_ids).pluck(:id)
      end

      Decidim::LdtUseCaseScenarios::UseCaseScenario.where(decidim_component_id: component_ids).map do |use_case_scenario|
        # Skip use case scenarios with missing component
        next if use_case_scenario.component.nil?
        
        {
          id: use_case_scenario.id,
          name: use_case_scenario.name,
          type: 'UseCaseScenario',
          owner: use_case_scenario.component.participatory_space&.decidim_organization_id || @organization.id,
          created_at: use_case_scenario.created_at,
          last_modified: use_case_scenario.updated_at,
          deleted: use_case_scenario.respond_to?(:deleted_at) ? use_case_scenario.deleted_at.present? : false,
          entity: use_case_scenario
        }
      end.compact
    end
  end
end