@echo off
echo Installing Android SDK components...
set ANDROID_HOME=C:\Users\gsinr\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin

echo Installing Android 36 platform...
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "platforms;android-36" --verbose

echo Installing build tools...
"%ANDROID_HOME%\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;36.0.0" --verbose

echo Installation complete!
pause


