// Images
require.context('../images', true);

import 'src/decidim/extra_user_fields/signup_form';
import PasswordValidatorController from 'src/decidim/extra_user_fields/password_validator';

// Register the password validator controller with Stimulus
Stimulus.register('password-validator', PasswordValidatorController);
