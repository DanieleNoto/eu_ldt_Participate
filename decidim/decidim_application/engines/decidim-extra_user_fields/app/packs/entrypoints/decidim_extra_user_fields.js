// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
// Images
require.context('../images', true);

import { Application } from '@hotwired/stimulus';
import 'src/decidim/extra_user_fields/signup_form';
import PasswordValidatorController from 'src/decidim/extra_user_fields/password_validator';

// Register the password validator controller with Stimulus
const application = Application.start();
application.register('password-validator', PasswordValidatorController);
