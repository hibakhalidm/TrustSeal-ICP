import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Result "mo:Result";

// Import the actor to test
import TrustSealBackend "../main";

actor TestRunner {
  
  // Test actor instance
  let trustSeal = await TrustSealBackend.TrustSealBackend();
  
  // Test principals
  let testPrincipal1 = Principal.fromText("be2us-64aaa-aaaaa-qadbq-cai");
  let testPrincipal2 = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
  let testPrincipal3 = Principal.fromText("qoctq-giaaa-aaaaa-aaaea-cai");
  
  // Test data
  let testName = "Test User";
  let testOrganization = "Test Organization";
  let testStudentName = "John Doe";
  let testCredentialType = "Bachelor of Science";
  let testInstitution = "Test University";
  let testIssueDate = "2023-06-15";
  let testReason = "Test revocation reason";
  
  // Test results storage
  var testResults: [Text] = [];
  
  // Helper function to add test result
  private func addResult(testName: Text, passed: Bool, message: ?Text) {
    let result = if (passed) {
      "✅ " # testName # " PASSED"
    } else {
      "❌ " # testName # " FAILED" # 
      switch (message) {
        case (?msg) { ": " # msg };
        case null { "" };
      }
    };
    testResults := Array.append(testResults, [result]);
  };
  
  // Helper function to run test
  private func runTest(testName: Text, testFunc: () -> async Bool, expectedMessage: ?Text) : async () {
    try {
      let result = await testFunc();
      addResult(testName, result, expectedMessage);
    } catch (error) {
      addResult(testName, false, ?("Exception: " # Error.message(error)));
    };
  };
  
  // Test input validation
  private func testInputValidation() : async Bool {
    // Test empty name
    let emptyNameResult = await trustSeal.registerUser(
      testPrincipal1, 
      #Issuer, 
      "", 
      testOrganization
    );
    if (Result.isOk(emptyNameResult)) return false;
    
    // Test empty organization
    let emptyOrgResult = await trustSeal.registerUser(
      testPrincipal1, 
      #Issuer, 
      testName, 
      ""
    );
    if (Result.isOk(emptyOrgResult)) return false;
    
    // Test invalid date format
    let invalidDateResult = await trustSeal.mint(
      testPrincipal1,
      testStudentName,
      testCredentialType,
      testInstitution,
      "invalid-date"
    );
    if (Result.isOk(invalidDateResult)) return false;
    
    true
  };
  
  // Test RBAC enforcement
  private func testRBACEnforcement() : async Bool {
    // Try to register admin without being admin
    let nonAdminRegisterResult = await trustSeal.registerUser(
      testPrincipal1, 
      #Admin, 
      testName, 
      testOrganization
    );
    if (Result.isOk(nonAdminRegisterResult)) return false;
    
    // Try to get system stats without being admin
    let nonAdminStatsResult = await trustSeal.getSystemStats();
    if (Result.isOk(nonAdminStatsResult)) return false;
    
    // Try to mint credential without being verified issuer
    let nonIssuerMintResult = await trustSeal.mint(
      testPrincipal1,
      testStudentName,
      testCredentialType,
      testInstitution,
      testIssueDate
    );
    if (Result.isOk(nonIssuerMintResult)) return false;
    
    true
  };
  
  // Test rate limiting
  private func testRateLimiting() : async Bool {
    // First call should succeed
    let firstCallResult = await trustSeal.updateLastLogin();
    if (not Result.isOk(firstCallResult)) return false;
    
    // Second call immediately should fail due to rate limiting
    let secondCallResult = await trustSeal.updateLastLogin();
    if (Result.isOk(secondCallResult)) return false;
    
    // Check if error message contains rate limit info
    switch (secondCallResult) {
      case (#ok(_)) { false };
      case (#err(msg)) { 
        Text.contains(msg, #text "Rate limit exceeded")
      };
    }
  };
  
  // Test pagination
  private func testPagination() : async Bool {
    // Test pagination parameters validation
    let invalidLimitResult = await trustSeal.getAllCredentials({
      offset = 0;
      limit = 1000; // Should exceed MAX_PAGE_SIZE
    });
    
    // Should return error for invalid limit
    if (Result.isOk(invalidLimitResult)) return false;
    
    // Test valid pagination
    let validResult = await trustSeal.getAllCredentials({
      offset = 0;
      limit = 10;
    });
    
    // Should return valid page structure
    switch (validResult) {
      case (#ok(page)) { 
        page.items.size() <= 10 and 
        page.total >= 0 and
        (page.nextCursor != null or page.items.size() < page.total)
      };
      case (#err(_)) { false };
    }
  };
  
  // Test credential lifecycle
  private func testCredentialLifecycle() : async Bool {
    // First, we need to initialize admin and register an issuer
    // This is a simplified test - in real scenario we'd need proper setup
    
    // Test credential verification
    let verifyResult = await trustSeal.verifyCredential(999); // Non-existent credential
    if (verifyResult != null) return false;
    
    true
  };
  
  // Test user management
  private func testUserManagement() : async Bool {
    // Test user role retrieval
    let roleResult = await trustSeal.getUserRole(testPrincipal1);
    if (roleResult != null) return false; // Should be null for non-existent user
    
    // Test user profile retrieval
    let profileResult = await trustSeal.getUserProfile(testPrincipal1);
    if (profileResult != null) return false; // Should be null for non-existent user
    
    true
  };
  
  // Main test runner
  public func runAllTests() : async [Text] {
    testResults := [];
    
    await runTest("Input Validation", testInputValidation, null);
    await runTest("RBAC Enforcement", testRBACEnforcement, null);
    await runTest("Rate Limiting", testRateLimiting, null);
    await runTest("Pagination", testPagination, null);
    await runTest("Credential Lifecycle", testCredentialLifecycle, null);
    await runTest("User Management", testUserManagement, null);
    
    testResults
  };
  
  // Individual test runners for debugging
  public func testInputValidationOnly() : async [Text] {
    testResults := [];
    await runTest("Input Validation", testInputValidation, null);
    testResults
  };
  
  public func testRBACOnly() : async [Text] {
    testResults := [];
    await runTest("RBAC Enforcement", testRBACEnforcement, null);
    testResults
  };
  
  public func testRateLimitingOnly() : async [Text] {
    testResults := [];
    await runTest("Rate Limiting", testRateLimiting, null);
    testResults
  };
  
  public func testPaginationOnly() : async [Text] {
    testResults := [];
    await runTest("Pagination", testPagination, null);
    testResults
  };
  
  // Helper function to get test results
  public query func getTestResults() : [Text] {
    testResults
  };
  
  // Helper function to clear test results
  public func clearTestResults() {
    testResults := [];
  };
};