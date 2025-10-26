@echo off
echo Setting up Android SDK for React Native...
set ANDROID_HOME=C:\Users\gsinr\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\cmdline-tools\latest\bin

echo Installing Android SDK components...
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platforms;android-34"
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;34.0.0"
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools"

echo Running React Native doctor...
npx react-native doctor

echo Running Android build...
npm run android

pause


