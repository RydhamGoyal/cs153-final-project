#!/bin/bash
set -e

mkdir -p data/raw data/db data/pdfs data/embeddings data/eval

echo "Downloading openFDA 510k bulk file..."
curl -L --progress-bar -o data/raw/device-510k.json.zip \
  https://download.open.fda.gov/device/510k/device-510k-0001-of-0001.json.zip

echo "Unzipping..."
unzip -o data/raw/device-510k.json.zip -d data/raw/

echo "Downloading recall data..."
curl -L --progress-bar -o data/raw/device-recall.json.zip \
  https://download.open.fda.gov/device/recall/device-recall-0001-of-0001.json.zip
unzip -o data/raw/device-recall.json.zip -d data/raw/

echo "Done. Files in data/raw/"
