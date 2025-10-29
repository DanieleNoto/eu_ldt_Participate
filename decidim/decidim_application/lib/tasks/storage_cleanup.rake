namespace :storage do
  desc "Clean up orphaned ActiveStorage blobs that have no attachments"
  task cleanup_orphaned_blobs: :environment do
    Rails.logger.info "Starting cleanup of orphaned ActiveStorage blobs..."

    orphaned_blobs = ActiveStorage::Blob.where.missing(:attachments)
    count = orphaned_blobs.count

    Rails.logger.info "Found #{count} orphaned blobs"

    if count == 0
      Rails.logger.info "No orphaned blobs to clean up."
      next
    end

    # Create a backup of blob IDs before deletion
    backup_file = Rails.root.join("tmp", "orphaned_blobs_backup_#{Time.current.to_i}.txt")
    File.open(backup_file, 'w') do |f|
      orphaned_blobs.each do |blob|
        f.puts "#{blob.id},#{blob.filename},#{blob.key}"
      end
    end
    Rails.logger.info "Backup created at: #{backup_file}"

    deleted_count = 0
    errors = []

    orphaned_blobs.find_each do |blob|
      Rails.logger.info "Deleting blob #{blob.id} (#{blob.filename})..."
      begin
        blob.purge
        deleted_count += 1
        Rails.logger.info "  ✓ Successfully deleted blob #{blob.id}"
      rescue => e
        error_msg = "  ✗ Error deleting blob #{blob.id}: #{e.message}"
        Rails.logger.error error_msg
        errors << error_msg
      end
    end

    Rails.logger.info "Cleanup completed. Deleted #{deleted_count} orphaned blobs."
    Rails.logger.info "Errors encountered: #{errors.size}" unless errors.empty?
    errors.each { |error| Rails.logger.error error }
  end
end