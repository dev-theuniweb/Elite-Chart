# Bitcoin Trading Chart - Windows Server Deployment Script
# Run this script as Administrator on your Windows Server

param(
    [string]$SiteName = "BTCChart",
    [string]$Port = "80",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\btc-chart"
)

Write-Host "=== Bitcoin Trading Chart Deployment Script ===" -ForegroundColor Green
Write-Host "Deploying to: $PhysicalPath" -ForegroundColor Yellow
Write-Host "Site Name: $SiteName" -ForegroundColor Yellow
Write-Host "Port: $Port" -ForegroundColor Yellow

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    exit 1
}

# Install IIS if not already installed
Write-Host "Checking IIS installation..." -ForegroundColor Cyan
$iisFeature = Get-WindowsFeature -Name IIS-WebServerRole
if ($iisFeature.InstallState -ne "Installed") {
    Write-Host "Installing IIS..." -ForegroundColor Yellow
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing -All
    Write-Host "IIS installed successfully!" -ForegroundColor Green
} else {
    Write-Host "IIS is already installed." -ForegroundColor Green
}

# Install URL Rewrite Module (required for React routing)
Write-Host "Checking URL Rewrite Module..." -ForegroundColor Cyan
if (!(Get-Module -ListAvailable -Name WebAdministration)) {
    Import-Module WebAdministration
}

# Create physical directory
Write-Host "Creating deployment directory..." -ForegroundColor Cyan
if (!(Test-Path $PhysicalPath)) {
    New-Item -ItemType Directory -Path $PhysicalPath -Force
    Write-Host "Created directory: $PhysicalPath" -ForegroundColor Green
} else {
    Write-Host "Directory already exists: $PhysicalPath" -ForegroundColor Yellow
}

# Copy files (assumes this script is in the same directory as dist folder)
Write-Host "Copying application files..." -ForegroundColor Cyan
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$distPath = Join-Path $scriptPath "dist"

if (Test-Path $distPath) {
    Copy-Item -Path "$distPath\*" -Destination $PhysicalPath -Recurse -Force
    Write-Host "Files copied successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: dist folder not found at $distPath" -ForegroundColor Red
    Write-Host "Please ensure this script is in the same directory as your dist folder." -ForegroundColor Red
    exit 1
}

# Remove default IIS site if it exists on the same port
$existingSite = Get-Website | Where-Object { $_.Bindings.Collection.bindingInformation -like "*:$Port:*" }
if ($existingSite -and $existingSite.Name -ne $SiteName) {
    Write-Host "Removing existing site on port $Port..." -ForegroundColor Yellow
    Remove-Website -Name $existingSite.Name
}

# Create or update IIS website
Write-Host "Configuring IIS website..." -ForegroundColor Cyan
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "Updating existing site: $SiteName" -ForegroundColor Yellow
    Set-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port
} else {
    Write-Host "Creating new site: $SiteName" -ForegroundColor Yellow
    New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port
}

# Set proper permissions
Write-Host "Setting directory permissions..." -ForegroundColor Cyan
$acl = Get-Acl $PhysicalPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
Set-Acl $PhysicalPath $acl

# Start the website
Write-Host "Starting website..." -ForegroundColor Cyan
Start-Website -Name $SiteName

# Configure Application Pool (optional optimization)
Write-Host "Configuring Application Pool..." -ForegroundColor Cyan
$appPoolName = $SiteName + "AppPool"
if (!(Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue)) {
    New-WebAppPool -Name $appPoolName
}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.applicationHost/applicationPools/add[@name='$appPoolName']" -name "recycling.periodicRestart.time" -value "00:00:00"
Set-ItemProperty -Path "IIS:\AppPools\$appPoolName" -Name processModel.identityType -Value ApplicationPoolIdentity

# Open firewall port
Write-Host "Configuring Windows Firewall..." -ForegroundColor Cyan
New-NetFirewallRule -DisplayName "IIS-$SiteName-$Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -ErrorAction SilentlyContinue

Write-Host "" -ForegroundColor White
Write-Host "=== DEPLOYMENT COMPLETED SUCCESSFULLY! ===" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Your Bitcoin Trading Chart is now deployed and running!" -ForegroundColor Green
Write-Host "Local URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Network URL: http://YOUR_SERVER_IP:$Port" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the application by visiting the URLs above" -ForegroundColor White
Write-Host "2. Configure DNS to point your domain to this server" -ForegroundColor White
Write-Host "3. Set up SSL certificate for HTTPS (recommended)" -ForegroundColor White
Write-Host "4. Configure monitoring and backups" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Display website status
Get-Website -Name $SiteName | Format-List Name, State, PhysicalPath, Bindings

Write-Host "Press any key to exit..." -ForegroundColor Gray
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null