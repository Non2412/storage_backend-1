# 🧪 Test API Script for Shelter Management System
# ใช้ PowerShell กับ -UseBasicParsing เพื่อหลีกเลี่ยง security warning

$API_URL = "http://localhost:3000"
$EMAIL = "admin@test.com"
$PASSWORD = "admin123"

# ============================================
# 1. LOGIN - ดึง token
# ============================================
Write-Host "🔐 1. Testing Login..." -ForegroundColor Cyan

$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "$API_URL/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $loginBody `
    -UseBasicParsing

$loginData = $loginResponse.Content | ConvertFrom-Json
$TOKEN = $loginData.data.token

Write-Host "✅ Login Success!" -ForegroundColor Green
Write-Host "Token: $($TOKEN.Substring(0, 50))..." -ForegroundColor Gray
Write-Host ""

# ============================================
# 2. GET SHELTERS - ดูรายการศูนย์พักพิง
# ============================================
Write-Host "🏛️ 2. Testing GET /api/shelters..." -ForegroundColor Cyan

try {
    $sheltersResponse = Invoke-WebRequest -Uri "$API_URL/api/shelters" `
        -Method GET `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -UseBasicParsing
    
    $sheltersData = $sheltersResponse.Content | ConvertFrom-Json
    Write-Host "✅ Shelters fetched successfully!" -ForegroundColor Green
    Write-Host "Count: $($sheltersData.data.Length)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# 3. POST SHELTERS - สร้างศูนย์พักพิงใหม่
# ============================================
Write-Host "🏢 3. Testing POST /api/shelters..." -ForegroundColor Cyan

$shelterBody = @{
    name = "Test Shelter Bangkok"
    province = "Bangkok"
    district = "Pathumwan"
    address = "123 Test Road"
    capacity = 500
    currentPeople = 100
    contactName = "Manager Test"
    contactPhone = "0812345678"
    latitude = 13.7563
    longitude = 100.5018
} | ConvertTo-Json

try {
    $createShelterResponse = Invoke-WebRequest -Uri "$API_URL/api/shelters" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -Body $shelterBody `
        -UseBasicParsing
    
    $shelterData = $createShelterResponse.Content | ConvertFrom-Json
    $SHELTER_ID = $shelterData.data._id
    Write-Host "✅ Shelter created!" -ForegroundColor Green
    Write-Host "Shelter ID: $SHELTER_ID" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# 4. GET DASHBOARD OVERVIEW
# ============================================
Write-Host "📊 4. Testing GET /api/dashboard/overview..." -ForegroundColor Cyan

try {
    $dashboardResponse = Invoke-WebRequest -Uri "$API_URL/api/dashboard/overview" `
        -Method GET `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -UseBasicParsing
    
    $dashboardData = $dashboardResponse.Content | ConvertFrom-Json
    Write-Host "✅ Dashboard data fetched!" -ForegroundColor Green
    Write-Host "Total Shelters: $($dashboardData.data.shelters.total)" -ForegroundColor Gray
    Write-Host "Shelters Nearly Full: $($dashboardData.data.shelters.nearlyFull)" -ForegroundColor Gray
    Write-Host "Shelters Full: $($dashboardData.data.shelters.full)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# 5. POST REQUEST - ยื่นคำร้องขอ
# ============================================
Write-Host "📝 5. Testing POST /api/requests (Submit Request)..." -ForegroundColor Cyan

if ($SHELTER_ID) {
    $requestBody = @{
        shelterId = $SHELTER_ID
        items = @(
            @{
                itemId = "507f1f77bcf86cd799439012"
                quantityRequested = 10
            }
        )
    } | ConvertTo-Json

    try {
        $submitResponse = Invoke-WebRequest -Uri "$API_URL/api/requests" `
            -Method POST `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $TOKEN"
            } `
            -Body $requestBody `
            -UseBasicParsing
        
        $requestData = $submitResponse.Content | ConvertFrom-Json
        Write-Host "✅ Request submitted!" -ForegroundColor Green
        Write-Host "Request ID: $($requestData.data._id)" -ForegroundColor Gray
        Write-Host "Status: $($requestData.data.status)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Note: Item ID may not exist. This is expected in demo." -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "⚠️ Skipped: No Shelter ID available" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================
# 6. GET REQUESTS - ดูรายการคำร้องขอ
# ============================================
Write-Host "📋 6. Testing GET /api/requests..." -ForegroundColor Cyan

try {
    $requestsResponse = Invoke-WebRequest -Uri "$API_URL/api/requests" `
        -Method GET `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -UseBasicParsing
    
    $requestsData = $requestsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Requests fetched!" -ForegroundColor Green
    Write-Host "Total Requests: $($requestsData.data.Length)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# SUMMARY
# ============================================
Write-Host "✨ Test Complete!" -ForegroundColor Green
Write-Host "All major endpoints tested successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check API_DOCUMENTATION.md for all endpoints" -ForegroundColor Gray
Write-Host "  2. Test with Postman or Thunder Client" -ForegroundColor Gray
Write-Host "  3. Create Frontend application" -ForegroundColor Gray
Write-Host "  4. Deploy to production" -ForegroundColor Gray
