# Release & Rollback

## Pre-merge to `production`

- [ ] CI green on `develop`
- [ ] Changelog entry if needed

## Deploy (human owner)

```bash
firebase use <prod-project-id>
yarn build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

## Rollback

- Revert merge commit (git revert -m 1 <sha>)

- Redeploy rules/hosting with the previous known-good commit
