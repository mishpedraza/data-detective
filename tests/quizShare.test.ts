import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shareLink } from '../src/lib/site'
import { inviteMessage } from '../src/lib/scorecard'

test('a quiz invite links to the quiz, is tagged as an invite and carries no score', () => {
  const url = new URL(shareLink({ quiz: 'housing-crisis' }, 'invite'))
  assert.equal(url.origin + url.pathname, 'https://data-detective.pages.dev/')
  const params = new URLSearchParams(url.hash.split('?')[1])
  assert.equal(params.get('quiz'), 'housing-crisis')
  assert.equal(params.get('from'), 'share')
  assert.equal(params.get('card'), 'invite')
  assert.equal(params.get('mode'), null)
  assert.doesNotMatch(inviteMessage('Why is housing so expensive?'), /\d\/\d|score/i)
})
