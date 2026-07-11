#!/bin/bash
set -e

echo "==========================================="
echo " Nakoda Jewellers - Git History Purge Tool"
echo "==========================================="
echo ""
echo "This script requires 'git-filter-repo' to be installed."
echo "If you don't have it, install it via python: pip install git-filter-repo"
echo "or via brew on macOS: brew install git-filter-repo"
echo ""

if ! command -v git-filter-repo &> /dev/null
then
    echo "ERROR: git-filter-repo could not be found."
    echo "Please install it first."
    exit 1
fi

echo "WARNING: This will permanently rewrite your local Git history."
echo "It will remove the following sensitive files from all past commits:"
echo " - scripts/migrate-to-d1.mjs"
echo " - scripts/migrate-images-to-r2.mjs"
echo " - supabase/migrations/*"
echo " - .env, .env.local, .env.development.local, .env.production.local"
echo ""
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation aborted."
    exit 1
fi

echo "Running git-filter-repo..."

git filter-repo \
  --path scripts/migrate-to-d1.mjs --invert-paths \
  --path scripts/migrate-images-to-r2.mjs --invert-paths \
  --path supabase/migrations --invert-paths \
  --path .env --invert-paths \
  --path .env.local --invert-paths \
  --path .env.development.local --invert-paths \
  --path .env.production.local --invert-paths \
  --force

echo ""
echo "✅ History successfully scrubbed locally!"
echo ""
echo "Next Steps:"
echo "1. Verify your local repo looks correct."
echo "2. Force-push the changes to your remote: git push origin --force --all"
echo "3. Tell any collaborators they MUST delete their local clones and re-clone."
echo "   (If they try to pull, they will merge the secrets back in!)"
echo ""
