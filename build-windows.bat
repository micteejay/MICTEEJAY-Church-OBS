@echo off
REM =======================================================================
REM Church OBS Studio - Windows Build Script
REM Prerequisites: Visual Studio 2022/2025 with C++ Desktop Development
REM =======================================================================

echo [1/3] Navigating to obs-studio...
cd /d "%~dp0obs-studio"

echo [2/3] Running CMake Configure for Windows x64...
cmake --preset windows-x64 -B build_x64

if %ERRORLEVEL% NEQ 0 (
    echo Error during CMake configuration.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Compiling Church OBS Studio (Release)...
cmake --build build_x64 --config Release --parallel

if %ERRORLEVEL% NEQ 0 (
    echo Error during compilation.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================================
echo Church OBS Studio built successfully for Windows!
echo Binary output: build_x64\rundir\Release\bin\64bit\obs64.exe
echo =======================================================================
pause

