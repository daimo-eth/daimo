#!/usr/bin/env bash

set -eox pipefail

if [ "$EAS_BUILD_PROFILE" = "maestro" ]; then
  echo "Uploading to Maestro"

  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH":"$HOME/.maestro/bin"

  brew install java
  echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc
  sudo ln -sfn /opt/homebrew/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
  export CPPFLAGS="-I/opt/homebrew/opt/openjdk/include"

  MAESTRO_API_KEY=$MAESTRO_API_KEY
  APP_EXECUTABLE_PATH="/Users/expo/workingdir/build/apps/daimo-mobile/ios/build/Build/Products/Release-iphonesimulator/Daimo.app"
  maestro cloud \
    --async \
    --apiKey $MAESTRO_API_KEY \
    --branch $EXPO_PUBLIC_GIT_BRANCH \
    --repoOwner daimo-eth \
    --repoName daimo \
    --pullRequestId $EXPO_PUBLIC_PR_ID \
    --commitSha $EAS_BUILD_GIT_COMMIT_HASH \
    $APP_EXECUTABLE_PATH .maestro/
else
  echo "Skipping Maestro upload"
fi