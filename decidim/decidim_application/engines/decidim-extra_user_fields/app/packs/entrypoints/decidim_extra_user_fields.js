// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
// Images
require.context('../images', true);

import { Application } from '@hotwired/stimulus';
import PasswordValidatorController from 'src/decidim/extra_user_fields/password_validator';
import UnderageController from 'src/decidim/extra_user_fields/underage_controller';

// Register controllers with Stimulus
const application = Application.start();
application.register('password-validator', PasswordValidatorController);
application.register('underage', UnderageController);
