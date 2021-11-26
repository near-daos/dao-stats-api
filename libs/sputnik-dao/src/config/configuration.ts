import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = '../../config/astro-config.yml';

export default () => {
  return yaml.load(
    readFileSync(
      process.env.ASTRO_CONFIG_PATH || join(__dirname, YAML_CONFIG_FILENAME),
      'utf8',
    ),
  ) as Record<string, any>;
};
