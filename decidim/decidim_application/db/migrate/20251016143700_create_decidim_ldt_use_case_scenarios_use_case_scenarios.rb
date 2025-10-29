class CreateDecidimLdtUseCaseScenariosUseCaseScenarios < ActiveRecord::Migration[6.1]
  def change
    create_table :decidim_ldt_use_case_scenarios_use_case_scenarios do |t|
      t.string :name, null: false
      t.string :experiment_id, null: false
      t.jsonb :experiment_data, default: {}, null: false
      t.references :decidim_component, foreign_key: true, null: false, index: false

      t.timestamps
    end

    add_index :decidim_ldt_use_case_scenarios_use_case_scenarios, 
              :decidim_component_id,
              name: 'idx_ldt_ucs_comp'

    add_index :decidim_ldt_use_case_scenarios_use_case_scenarios, 
              [:decidim_component_id, :experiment_id], 
              unique: true,
              name: 'idx_ldt_ucs_comp_exp'
  end
end
