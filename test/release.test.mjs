import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {releaseVersion,assertRegistryIntegrity} from '../scripts/publish-release.mjs';

test('release recovery accepts version tags and rejects ref or command input',()=>{
  assert.equal(releaseVersion('v0.1.1'),'0.1.1');
  assert.equal(releaseVersion('v1.2.3-rc.1'),'1.2.3-rc.1');
  for(const tag of [undefined,'0.1.1','refs/tags/v0.1.1','v0.1.1; echo injected','v0.1.1/other','v0.1.1\n'])assert.throws(()=>releaseVersion(tag));
});
test('an existing npm version must contain the exact qualified archive bytes',()=>{
  const archive=Buffer.from('qualified archive');
  const metadata={dist:{integrity:'sha512-'+createHash('sha512').update(archive).digest('base64')}};
  assert.doesNotThrow(()=>assertRegistryIntegrity(metadata,archive));
  assert.throws(()=>assertRegistryIntegrity(metadata,Buffer.from('different archive')));
  assert.throws(()=>assertRegistryIntegrity({},archive));
});
