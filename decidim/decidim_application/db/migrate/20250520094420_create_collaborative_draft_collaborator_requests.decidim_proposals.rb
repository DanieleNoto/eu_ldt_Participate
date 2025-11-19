# SPDX-License-Identifier: AGPL-3.0
# Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
# Authors:
# Denis Vasilev Dimchev
# Marco Pinnella
# Pierluigi Spedicato

# frozen_string_literal: true

class CreateCollaborativeDraftCollaboratorRequests < ActiveRecord::Migration[5.2]
  def change
    create_table :decidim_proposals_collaborative_draft_collaborator_requests do |t|
      t.belongs_to :decidim_proposals_collaborative_draft, null: false, index: { name: "index_collab_requests_on_decidim_proposals_collab_draft_id" }
      t.belongs_to :decidim_user, null: false, index: { name: "index_collab_requests_on_decidim_user_id" }

      t.timestamps
    end
  end
end
