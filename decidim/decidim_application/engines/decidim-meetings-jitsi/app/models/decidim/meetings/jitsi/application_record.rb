module Decidim
  module Meetings
    module Jitsi
      class ApplicationRecord < ActiveRecord::Base
        self.abstract_class = true
      end
    end
  end
end
