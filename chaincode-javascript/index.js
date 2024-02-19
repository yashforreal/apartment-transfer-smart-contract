/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const appartmentTransfer = require('./lib/appartmentTransfer');

module.exports.AppartmentTransfer = appartmentTransfer;
module.exports.contracts = [appartmentTransfer];