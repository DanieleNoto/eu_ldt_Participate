# frozen_string_literal: true

class CreateDecidimLdtMapVisualizations < ActiveRecord::Migration[6.1]
  def change
    create_table :decidim_ldt_map_visualizations do |t|
      t.string :name, null: false
      t.string :map_id, null: false
      t.text :map_data
      t.string :reference
      
      t.references :decidim_component,
                   foreign_key: true,
                   index: { name: "index_ldt_map_viz_on_decidim_component_id" }
      
      t.timestamps
    end
    
    add_index :decidim_ldt_map_visualizations,
              [:decidim_component_id, :map_id],
              name: "index_ldt_map_viz_on_component_and_map_id",
              unique: true
              
    add_index :decidim_ldt_map_visualizations,
              :reference,
              unique: true
  end
end
