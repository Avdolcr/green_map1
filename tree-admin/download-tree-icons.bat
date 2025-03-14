@echo off
echo Downloading tree icons...

:: Create the tree-icons directory if it doesn't exist
if not exist "public\tree-icons" mkdir "public\tree-icons"

:: Download the icons using curl (if available)
where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Using curl to download icons...
    :: Standard colored markers
    curl -o public\tree-icons\palm.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
    curl -o public\tree-icons\pine.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png"
    curl -o public\tree-icons\oak.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png"
    curl -o public\tree-icons\fruit.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png"
    curl -o public\tree-icons\flower.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png"
    
    :: Location-specific icons - add more distinctive icons for Naguilian
    curl -o public\tree-icons\narra.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png"
    curl -o public\tree-icons\mango.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png"
    curl -o public\tree-icons\bamboo.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
    curl -o public\tree-icons\coconut.png "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cadetblue.png"
) else (
    echo Using PowerShell to download icons...
    :: Standard colored markers
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' -OutFile 'public\tree-icons\palm.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' -OutFile 'public\tree-icons\pine.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png' -OutFile 'public\tree-icons\oak.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' -OutFile 'public\tree-icons\fruit.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png' -OutFile 'public\tree-icons\flower.png'"
    
    :: Location-specific icons - add more distinctive icons for Naguilian
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png' -OutFile 'public\tree-icons\narra.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png' -OutFile 'public\tree-icons\mango.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' -OutFile 'public\tree-icons\bamboo.png'"
    powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cadetblue.png' -OutFile 'public\tree-icons\coconut.png'"
)

echo Done downloading tree icons. The icons are just placeholder colored markers for now.
echo You should replace them with actual tree-specific icons for production use.
pause 