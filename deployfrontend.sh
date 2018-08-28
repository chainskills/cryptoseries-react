#!/usr/bin/env bash
rsync -r build_webpack/ docs/
git add .
git commit -m "adding frontend files to Github pages"
git push