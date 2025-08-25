# Decidim::Meetings::Jitsi

A custom gem that extends Decidim Meetings with Jitsi Meet integration features. This gem provides an easy way to generate Jitsi meeting URLs directly from the Decidim admin interface.

## Features

- **Jitsi URL Generator**: Automatically generates Jitsi meeting URLs with customizable room names
- **Component Settings Integration**: Configurable Jitsi server URL and room prefix through component settings
- **Admin Interface**: Simple button to generate Jitsi URLs directly from the meeting form
- **Smart URL Detection**: Automatically detects if a meeting already uses a Jitsi URL from the configured server
- **Flexible Configuration**: Supports both default values and custom settings per component

## Usage

### Component Configuration

In the Decidim admin panel, when configuring a Meetings component, you can set:

- **Jitsi Server URL**: The Jitsi server to use (default: `https://meet.jit.si`)
- **Jitsi Room Prefix**: Prefix for generated room names (default: `decidim-meeting-`)
- **Enable Jitsi Generator**: Toggle to enable/disable the generator feature

### Generating Jitsi URLs

1. Navigate to the Meetings admin section
2. Create or edit a meeting
3. Set the meeting type to "Online" or "Hybrid"
4. Click the "Generate Jitsi URL" button
5. The system will automatically generate a unique Jitsi room URL

### Default Values

The gem uses the following constants for default values:
- `JITSI_DEFAULT_SERVER_URL = "https://meet.jit.si"`
- `JITSI_DEFAULT_ROOM_PREFIX = "decidim-meeting-"`

These can be overridden through component settings.

## Installation

Add this line to your application's Gemfile:

```ruby
gem "decidim-meetings-jitsi", path: "decidim-meetings-jitsi"
```

And then execute:
```bash
$ bundle install
```

## Configuration

The gem automatically extends the existing Decidim Meetings component with additional settings. No additional configuration is required beyond the component-level settings available in the admin interface.

## File Structure

```
decidim-meetings-jitsi/
├── app/
│   ├── controllers/
│   │   └── jitsi_url_controller.rb          # AJAX endpoint for URL generation
│   ├── decorators/
│   │   ├── forms/decidim/meetings/admin/
│   │   │   └── meeting_form_decorator.rb    # Form helpers
│   │   └── models/decidim/meetings/
│   │       └── meeting_decorator.rb         # Meeting model extensions
│   └── views/
│       ├── decidim/meetings/admin/meetings/
│       │   └── _form.html.erb               # Extended meeting form
│       └── layouts/decidim/meetings/admin/meetings/
│           └── _jitsi_generator.html.erb    # Generator UI component
├── lib/
│   └── decidim/meetings/jitsi/
│       ├── constants.rb                     # Default constants
│       └── engine.rb                        # Rails engine configuration
└── config/
    └── routes.rb                            # Additional routes
```

## API

### Meeting Model Extensions

- `meeting.generate_jitsi_url` - Generates a new Jitsi URL for the meeting
- `meeting.has_generated_jitsi_url?` - Checks if the meeting URL is from the configured Jitsi server
- `meeting.jitsi_generator_enabled?` - Checks if the generator is enabled for this component

### Form Helpers

- `form.jitsi_server_url` - Returns the configured Jitsi server URL
- `form.jitsi_room_prefix` - Returns the configured room prefix
- `form.jitsi_generator_enabled?` - Checks if the generator is enabled

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Create a new Pull Request

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
