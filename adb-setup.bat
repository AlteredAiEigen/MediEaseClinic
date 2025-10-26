@echo off
echo Setting up ADB environment...
set PATH=%PATH%;C:\Users\gsinr\AppData\Local\Android\Sdk\platform-tools
echo ADB is now available in this session.
echo.
echo Testing ADB...
adb version
echo.
echo Checking connected devices...
adb devices
echo.
echo You can now use 'adb devices' and other adb commands in this window.
pause


