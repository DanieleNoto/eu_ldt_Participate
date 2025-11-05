require "test_helper"

class Decidim::AdminHeaderTest < ActiveSupport::TestCase
  test "it has a version number" do
    assert Decidim::AdminHeader::VERSION
  end
end
