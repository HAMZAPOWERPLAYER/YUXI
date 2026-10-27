import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type AppConfig = {
  expo: {
    name: string;
    slug: string;
    scheme: string;
    android: { package: string };
  };
};

describe('project scaffold', () => {
  it('uses the required store identity', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as AppConfig;

    expect(config.expo.name).toBe('Yuxi: Learn Japanese');
    expect(config.expo.slug).toBe('yuxi');
    expect(config.expo.scheme).toBe('yuxi');
    expect(config.expo.android.package).toBe('com.hamzapowerplayer.yuxi');
  });
});
