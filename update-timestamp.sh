#!/bin/bash
# Updates the deployment timestamp in ui-controller.js

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "Updating deployment timestamp to: $TIMESTAMP"

# Update the timestamp in ui-controller.js
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/const buildTimestamp = '.*'; \/\/ DEPLOYMENT_TIMESTAMP/const buildTimestamp = '$TIMESTAMP'; \/\/ DEPLOYMENT_TIMESTAMP/" ui-controller.js
else
  # Linux
  sed -i "s/const buildTimestamp = '.*'; \/\/ DEPLOYMENT_TIMESTAMP/const buildTimestamp = '$TIMESTAMP'; \/\/ DEPLOYMENT_TIMESTAMP/" ui-controller.js
fi

echo "Timestamp updated successfully!"
