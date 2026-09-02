@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot
set ANDROID_HOME=C:\Users\HUGO MIRANDA\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%
echo JAVA_HOME=%JAVA_HOME%
gradlew assembleDebug %*
if %errorlevel% neq 0 (
    echo ERROR: Fallo el build
    pause
    exit /b 1
)
echo OK
pause
