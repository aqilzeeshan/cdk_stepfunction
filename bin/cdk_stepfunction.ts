#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkStepfunctionStack } from '../lib/cdk_stepfunction-stack';

const app = new cdk.App();
new CdkStepfunctionStack(app, 'CdkStepfunctionStack');
