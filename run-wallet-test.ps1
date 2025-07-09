# Load .env into environment variables (non-commented lines only)
Get-Content .env | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

# Compile the test class
javac -d out -cp "lib/*" src/main/java/com/smartsupplypro/inventory/OracleWalletConnectionTest.java

# Run the test with -D options BEFORE -cp and quoted properly
java `
  "-Doracle.net.tns_admin=$env:TNS_ADMIN" `
  "-Doracle.net.wallet_password=$env:ORACLE_WALLET_PASSWORD" `
  -cp "out;lib/*" `
  com.smartsupplypro.inventory.OracleWalletConnectionTest
# Check the exit code of the Java program
