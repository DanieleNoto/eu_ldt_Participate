# frozen_string_literal: true
# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
  # Gianfranco Cedro



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
        {
          id: process.id,
          name: process.title[I18n.locale.to_s] || process.title['en'],
          type: 'ParticipatoryProcess',
          owner: process.decidim_organization_id,
          created_at: process.created_at,
          last_modified: process.updated_at,
          deleted: process.deleted_at.present?,
          entity: process
        }
      end
    end

    def collect_assemblies
      Decidim::Assembly.where(organization: @organization).map do |assembly|
        {
          id: assembly.id,
          name: assembly.title[I18n.locale.to_s] || assembly.title['en'],
          type: 'Assembly',
          owner: assembly.decidim_organization_id,
          created_at: assembly.created_at,
          last_modified: assembly.updated_at,
          deleted: assembly.deleted_at.present?,
          entity: assembly
        }
      end
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
        {
          id: meeting.id,
          name: meeting.title[I18n.locale.to_s] || meeting.title['en'],
          type: 'Meeting',
          owner: meeting.component.participatory_space.decidim_organization_id,
          created_at: meeting.created_at,
          last_modified: meeting.updated_at,
          deleted: meeting.deleted_at.present?,
          entity: meeting
        }
      end
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
        {
          id: proposal.id,
          name: proposal.title,
          type: 'Proposal',
          owner: proposal.component.participatory_space.decidim_organization_id,
          created_at: proposal.created_at,
          last_modified: proposal.updated_at,
          deleted: proposal.deleted_at.present?,
          entity: proposal
        }
      end
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
        {
          id: survey.id,
          name: survey.title[I18n.locale.to_s] || survey.title['en'],
          type: 'Survey',
          owner: survey.component.participatory_space.decidim_organization_id,
          created_at: survey.created_at,
          last_modified: survey.updated_at,
          deleted: survey.deleted_at.present?,
          entity: survey
        }
      end
    end

    def collect_conferences
      Decidim::Conference.where(organization: @organization).map do |conference|
        {
          id: conference.id,
          name: conference.title[I18n.locale.to_s] || conference.title['en'],
          type: 'Conference',
          owner: conference.decidim_organization_id,
          created_at: conference.created_at,
          last_modified: conference.updated_at,
          deleted: conference.deleted_at.present?,
          entity: conference
        }
      end
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
        {
          id: debate.id,
          name: debate.title[I18n.locale.to_s] || debate.title['en'],
          type: 'Debate',
          owner: debate.component.participatory_space.decidim_organization_id,
          created_at: debate.created_at,
          last_modified: debate.updated_at,
          deleted: debate.deleted_at.present?,
          entity: debate
        }
      end
    end

    def collect_initiatives
      Decidim::Initiative.where(organization: @organization).map do |initiative|
        {
          id: initiative.id,
          name: initiative.title[I18n.locale.to_s] || initiative.title['en'],
          type: 'Initiative',
          owner: initiative.decidim_organization_id,
          created_at: initiative.created_at,
          last_modified: initiative.updated_at,
          deleted: initiative.respond_to?(:deleted_at) ? initiative.deleted_at.present? : false,
          entity: initiative
        }
      end
    end

    def collect_map_visualizations
      # Get all component IDs that belong to participatory spaces of the current organization
      component_ids = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        component_ids += Decidim::Component.where(participatory_space_type: space_class.name, participatory_space_id: space_ids).pluck(:id)
      end

      Decidim::LdtMapVisualization::MapVisualization.where(decidim_component_id: component_ids).map do |map_visualization|
        {
          id: map_visualization.id,
          name: map_visualization.name,
          type: 'MapVisualization',
          owner: map_visualization.component.participatory_space.decidim_organization_id,
          created_at: map_visualization.created_at,
          last_modified: map_visualization.updated_at,
          deleted: map_visualization.respond_to?(:deleted_at) ? map_visualization.deleted_at.present? : false,
          entity: map_visualization
        }
      end
    end

    def collect_use_case_scenarios
      # Get all component IDs that belong to participatory spaces of the current organization
      component_ids = []
      [Decidim::ParticipatoryProcess, Decidim::Assembly, Decidim::Conference, Decidim::Initiative].each do |space_class|
        space_ids = space_class.where(decidim_organization_id: @organization.id).pluck(:id)
        component_ids += Decidim::Component.where(participatory_space_type: space_class.name, participatory_space_id: space_ids).pluck(:id)
      end

      Decidim::LdtUseCaseScenarios::UseCaseScenario.where(decidim_component_id: component_ids).map do |use_case_scenario|
        {
          id: use_case_scenario.id,
          name: use_case_scenario.name,
          type: 'UseCaseScenario',
          owner: use_case_scenario.component.participatory_space.decidim_organization_id,
          created_at: use_case_scenario.created_at,
          last_modified: use_case_scenario.updated_at,
          deleted: use_case_scenario.respond_to?(:deleted_at) ? use_case_scenario.deleted_at.present? : false,
          entity: use_case_scenario
        }
      end
    end
  end
end