// Images
require.context('../images', true);

import { Application } from '@hotwired/stimulus';
import 'src/decidim/extra_user_fields/signup_form';
import PasswordValidatorController from 'src/decidim/extra_user_fields/password_validator';

// Register the password validator controller with Stimulus
const application = Application.start();
application.register('password-validator', PasswordValidatorController);
