@echo off
REM Enhanced OWASP ZAP scanning for Juice Shop critical vulnerabilities
echo Starting enhanced ZAP scan for critical vulnerabilities...

REM Test Juice Shop accessibility
echo Testing Juice Shop accessibility...
curl -s http://localhost:8080 >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Juice Shop not accessible at localhost:8080
    echo Make sure port forwarding is active: kubectl port-forward svc/juice-shop 8080:3000
    exit /b 1
)

REM Create ZAP configuration for aggressive scanning
echo Creating ZAP aggressive configuration...
(
echo # ZAP Aggressive Scan Configuration
echo scanner.strength=HIGH
echo scanner.alertThreshold=LOW
echo scanner.maxScanDurationInMins=30
echo scanner.maxRuleDurationInMins=5
echo.
echo # Enable all vulnerability categories
echo scanner.sqlInjection=true
echo scanner.xss=true
echo scanner.pathTraversal=true
echo scanner.codeInjection=true
echo scanner.commandInjection=true
echo scanner.bufferOverflow=true
echo scanner.formatString=true
echo scanner.ldapInjection=true
echo scanner.xpathInjection=true
echo scanner.xmlInjection=true
echo scanner.ssiInjection=true
echo scanner.headerInjection=true
) > zap-aggressive-config.conf

REM Run comprehensive ZAP scan
echo Running comprehensive ZAP scan...
docker run --rm -v %cd%:/zap/wrk/:rw -u zap ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://host.docker.internal:8080 -J zap-critical-report.json -r zap-critical-report.html -x zap-critical-report.xml -c zap-aggressive-config.conf -d -T 30 -z "-config scanner.strength=HIGH -config scanner.alertThreshold=LOW"

REM Run targeted API scan
echo Running targeted API scan...
docker run --rm -v %cd%:/zap/wrk/:rw -u zap ghcr.io/zaproxy/zaproxy:stable zap-api-scan.py -t http://host.docker.internal:8080 -f openapi -J zap-api-report.json -r zap-api-report.html -c zap-aggressive-config.conf -T 15

echo ZAP scans completed!
echo Reports generated:
echo   - zap-critical-report.json
echo   - zap-critical-report.html
echo   - zap-api-report.json
echo   - zap-api-report.html

REM Run enhanced Python analysis if available
if exist "enhanced-zap-scan.py" (
    echo Running enhanced AI analysis...
    python enhanced-zap-scan.py
) else (
    echo Enhanced analysis script not found. Run the Python script manually.
)

pause