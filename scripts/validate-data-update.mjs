#!/usr/bin/env node
// validate-data-update.mjs
// Pre-commit hook: ensures no bets are deleted from dashboard-data.json.
// Compares staged version against HEAD version.
// Usage: node validate-data-update.mjs (run from repo root)

import { execSync } from 'child_process'

try {
  // Get the HEAD version of the file
  const headRaw = execSync('git show HEAD:public/dashboard-data.json', { encoding: 'utf-8' })
  const headData = JSON.parse(headRaw)
  const headBetIds = new Set((headData.bets || []).map(b => b.id))

  // Get the staged version
  const stagedRaw = execSync('git show :public/dashboard-data.json', { encoding: 'utf-8' })
  const stagedData = JSON.parse(stagedRaw)
  const stagedBetIds = new Set((stagedData.bets || []).map(b => b.id))

  // Check that no bet IDs were removed
  const removed = [...headBetIds].filter(id => !stagedBetIds.has(id))
  if (removed.length > 0) {
    console.error(`BLOCKED: ${removed.length} bet(s) would be deleted: ${removed.join(', ')}`)
    console.error('The bets array is append-only. Existing bets must never be removed.')
    process.exit(1)
  }

  // Check that resolved bets haven't had their result reverted to PENDING
  const headBetsMap = new Map((headData.bets || []).map(b => [b.id, b]))
  for (const bet of stagedData.bets || []) {
    const old = headBetsMap.get(bet.id)
    if (old && (old.result === 'WIN' || old.result === 'LOSS') && bet.result === 'PENDING') {
      console.error(`BLOCKED: Bet ${bet.id} result reverted from ${old.result} to PENDING.`)
      process.exit(1)
    }
  }

  console.log(`OK: ${stagedBetIds.size} bets (${stagedBetIds.size - headBetIds.size} new). No bets removed.`)
} catch (e) {
  // If HEAD doesn't have the file yet, allow anything
  if (e.message?.includes('does not exist')) {
    console.log('OK: first commit of dashboard-data.json')
  } else {
    // Don't block on validation errors (e.g. git issues)
    console.warn('Warning: validation skipped:', e.message)
  }
}
