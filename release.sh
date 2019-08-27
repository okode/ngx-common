#!/bin/bash
set -eo pipefail

if [[ $# -ne 2 ]]; then
    echo "Syntax: release [CURRENT_VERSION] [NEXT_VERSION]"
    exit 1
fi

if [[ -n $(git status -z) ]]; then
    echo "Repository not clean, ensure you have committed all your changes"
    exit 1
fi

CURRENT=$1
NEXT=$2

# Create new tag
git tag -a $CURRENT -m $CURRENT

# Publish tag
git push --tags

# Bump version
sed -i '' "s/$CURRENT/$NEXT/" package.json

# Update develop with new bumped version
git commit -a -m"Bumped version ($NEXT) [ci skip]"
git push
