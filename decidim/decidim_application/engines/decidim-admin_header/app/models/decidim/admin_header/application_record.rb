module Decidim
  module AdminHeader
    class ApplicationRecord < ActiveRecord::Base
      self.abstract_class = true
    end
  end
end
