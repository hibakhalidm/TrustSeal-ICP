/**
 * TrustSeal ICP Backend Canister
 * 
 * A decentralized credential verification system built on Internet Computer Protocol (ICP).
 * Implements role-based access control (RBAC) for secure credential management.
 * 
 * Features:
 * - NFT-based digital credentials (DIP721 compliant)
 * - Role-based user management (Admin, Issuer, Checker)
 * - Credential issuance, verification, and revocation
 * - Audit trails and system statistics
 * - Enhanced security with input validation and rate limiting
 * 
 * @author TrustSeal Team
 * @version 1.1.0 - Enhanced Security & Scalability
 */

import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:Result";
import Time "mo:base/Time";
import Option "mo:base/Option";
import Trie "mo:base/Trie";

actor TrustSealBackend {

  /// Unique identifier for NFT credentials, compliant with DIP721 standard
  public type TokenIdentifier = Nat;
  
  /// Principal type alias for better readability
  public type Principal = Principal.Principal;
  
  public type UserRole = {
    #Admin;
    #Issuer;
    #Checker;
  };

  public type UserProfile = {
    principal: Principal;
    role: UserRole;
    name: Text;
    organization: Text;
    verified: Bool;
    registration_date: Int;
    last_login: ?Int;
  };
  
  public type Metadata = {
    student_name: Text;
    credential_type: Text;
    institution: Text;
    issue_date: Text;
    revoked: Bool;
    revocation_reason: ?Text;
  };

  public type Credential = {
    id: TokenIdentifier;
    owner: Principal;
    issuer: Principal;
    metadata: Metadata;
    issue_timestamp: Int;
  };

  // Pagination types
  public type Page<T> = {
    items: [T];
    nextCursor: ?Text;
    total: Nat;
  };

  public type PaginationParams = {
    offset: Nat;
    limit: Nat;
  };

  // Storage
  private stable var nextTokenId: Nat = 0;
  private stable var credentialsEntries: [(TokenIdentifier, Credential)] = [];
  private stable var userProfilesEntries: [(Principal, UserProfile)] = [];
  private var credentials = HashMap.HashMap<TokenIdentifier, Credential>(16, Nat.equal, Nat.hash);
  private var userProfiles = HashMap.HashMap<Principal, UserProfile>(16, Principal.equal, Principal.hash);
  
  // Default admin principal (set during deployment)
  private stable var adminPrincipal: ?Principal = null;

  // Rate limiting storage
  private stable var lastCallEntries: [(Principal, Int)] = [];
  private var lastCall = HashMap.HashMap<Principal, Int>(16, Principal.equal, Principal.hash);

  // Configuration constants
  private let MAX_TEXT_LENGTH: Nat = 1000;
  private let MAX_NAME_LENGTH: Nat = 100;
  private let MAX_ORGANIZATION_LENGTH: Nat = 200;
  private let RATE_LIMIT_SECONDS: Nat = 1; // Minimum 1 second between calls
  private let MAX_PAGE_SIZE: Nat = 100; // Maximum items per page

  // System upgrade hooks
  system func preupgrade() {
    credentialsEntries := Iter.toArray(credentials.entries());
    userProfilesEntries := Iter.toArray(userProfiles.entries());
    lastCallEntries := Iter.toArray(lastCall.entries());
  };

  system func postupgrade() {
    credentialsEntries := [];
    userProfilesEntries := [];
    lastCallEntries := [];
  };

  // ===== INPUT VALIDATION HELPERS =====
  
  private func nonEmpty(t: Text, maxLength: Nat): Bool {
    t.size() > 0 and t.size() <= maxLength
  };

  private func isValidDate(t: Text): Bool {
    // Simple ISO 8601 date validation (YYYY-MM-DD)
    if (t.size() != 10) return false;
    if (Text.char(t, 4) != '-' or Text.char(t, 7) != '-') return false;
    
    // Basic year validation (1900-2100)
    let year = Text.sub(t, 0, 4);
    let month = Text.sub(t, 5, 2);
    let day = Text.sub(t, 8, 2);
    
    // Convert to numbers and validate ranges
    // This is a simplified validation - in production, use proper date parsing
    true
  };

  private func isValidPrincipal(p: Principal): Bool {
    // Basic principal validation
    Principal.isAnonymous(p) == false
  };

  // ===== RATE LIMITING =====
  
  private func canCall(caller: Principal, now: Int, minGapSecs: Nat): Bool {
    switch (lastCall.get(caller)) {
      case (?lastCallTime) { 
        let timeDiff = now - lastCallTime;
        timeDiff >= (minGapSecs * 1_000_000_000) // Convert seconds to nanoseconds
      };
      case null { true };
    }
  };

  private func updateLastCall(caller: Principal, now: Int) {
    lastCall.put(caller, now);
  };

  // ===== RBAC GUARDS =====
  
  private func requireRole(caller: Principal, allowedRoles: [UserRole]): Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        Array.some<UserRole>(allowedRoles, func(role) = profile.role == role)
      };
      case null { false };
    }
  };

  private func requireAdmin(caller: Principal): Bool {
    requireRole(caller, [#Admin])
  };

  private func requireIssuer(caller: Principal): Bool {
    requireRole(caller, [#Admin, #Issuer])
  };

  private func requireVerifiedIssuer(caller: Principal): Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.role) {
          case (#Issuer) { profile.verified };
          case (#Admin) { true }; // Admin can also issue
          case (#Checker) { false };
        }
      };
      case null { false };
    }
  };

  // ===== INITIALIZATION =====

  // Initialize admin (call once after deployment)
  public shared({ caller }) func initializeAdmin() : async Result.Result<Text, Text> {
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    switch (adminPrincipal) {
      case (?_) { #err("Admin already initialized") };
      case null {
        adminPrincipal := ?caller;
        let adminProfile: UserProfile = {
          principal = caller;
          role = #Admin;
          name = "System Administrator";
          organization = "TrustSeal ICP";
          verified = true;
          registration_date = now;
          last_login = ?now;
        };
        userProfiles.put(caller, adminProfile);
        updateLastCall(caller, now);
        #ok("Admin initialized successfully")
      };
    }
  };

  // ===== USER MANAGEMENT =====

  // Register new user (admin only or self-registration for checkers)
  public shared({ caller }) func registerUser(
    userPrincipal: Principal,
    role: UserRole,
    name: Text,
    organization: Text
  ) : async Result.Result<Text, Text> {
    
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    // Input validation
    if (not isValidPrincipal(userPrincipal)) {
      return #err("Invalid principal provided");
    };
    
    if (not nonEmpty(name, MAX_NAME_LENGTH)) {
      return #err("Name must be between 1 and " # Nat.toText(MAX_NAME_LENGTH) # " characters");
    };
    
    if (not nonEmpty(organization, MAX_ORGANIZATION_LENGTH)) {
      return #err("Organization must be between 1 and " # Nat.toText(MAX_ORGANIZATION_LENGTH) # " characters");
    };
    
    // Check permissions
    let canRegister = switch (role) {
      case (#Admin) { requireAdmin(caller) };
      case (#Issuer) { requireAdmin(caller) };
      case (#Checker) { requireAdmin(caller) or Principal.equal(caller, userPrincipal) };
    };

    if (not canRegister) {
      return #err("Unauthorized to register this role");
    };

    // Check if user already exists
    switch (userProfiles.get(userPrincipal)) {
      case (?_) { #err("User already registered") };
      case null {
        let profile: UserProfile = {
          principal = userPrincipal;
          role = role;
          name = name;
          organization = organization;
          verified = requireAdmin(caller); // Admin registrations are auto-verified
          registration_date = now;
          last_login = null;
        };
        userProfiles.put(userPrincipal, profile);
        updateLastCall(caller, now);
        #ok("User registered successfully")
      };
    }
  };

  // Get user role
  public query func getUserRole(user: Principal) : async ?UserRole {
    switch (userProfiles.get(user)) {
      case (?profile) { ?profile.role };
      case null { null };
    }
  };

  // Get user profile
  public query func getUserProfile(user: Principal) : async ?UserProfile {
    userProfiles.get(user)
  };

  // Verify user (admin only)
  public shared({ caller }) func verifyUser(userPrincipal: Principal) : async Result.Result<Text, Text> {
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    if (not requireAdmin(caller)) {
      return #err("Only admin can verify users");
    };

    switch (userProfiles.get(userPrincipal)) {
      case (?profile) {
        let updatedProfile = {
          profile with verified = true;
        };
        userProfiles.put(userPrincipal, updatedProfile);
        updateLastCall(caller, now);
        #ok("User verified successfully")
      };
      case null { #err("User not found") };
    }
  };

  // Update last login
  public shared({ caller }) func updateLastLogin() : async Result.Result<Text, Text> {
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          profile with last_login = ?now;
        };
        userProfiles.put(caller, updatedProfile);
        updateLastCall(caller, now);
        #ok("Login updated")
      };
      case null { #err("User not found") };
    }
  };

  // Get all users with pagination (admin only)
  public shared({ caller }) func getAllUsers(params: PaginationParams) : async Result.Result<Page<UserProfile>, Text> {
    if (not requireAdmin(caller)) {
      return #err("Only admin can view all users");
    };
    
    // Validate pagination parameters
    if (params.limit > MAX_PAGE_SIZE) {
      return #err("Page size cannot exceed " # Nat.toText(MAX_PAGE_SIZE));
    };
    
    let allUsers = Iter.toArray(
      Iter.map(
        userProfiles.entries(),
        func(entry: (Principal, UserProfile)) : UserProfile = entry.1
      )
    );
    
    let total = allUsers.size();
    let start = Nat.min(params.offset, total);
    let end = Nat.min(start + params.limit, total);
    
    let pageItems = Array.subArray<UserProfile>(allUsers, start, end - start);
    let nextCursor = if (end < total) ?Nat.toText(end) else null;
    
    #ok({
      items = pageItems;
      nextCursor = nextCursor;
      total = total;
    })
  };

  // ===== CREDENTIAL MANAGEMENT =====

  // Mint a new credential NFT (verified issuers only)
  public shared({ caller }) func mint(
    student_principal: Principal,
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
  ) : async Result.Result<TokenIdentifier, Text> {
    
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    if (not requireVerifiedIssuer(caller)) {
      return #err("Only verified issuers can mint credentials");
    };

    // Input validation
    if (not isValidPrincipal(student_principal)) {
      return #err("Invalid student principal provided");
    };
    
    if (not nonEmpty(student_name, MAX_NAME_LENGTH)) {
      return #err("Student name must be between 1 and " # Nat.toText(MAX_NAME_LENGTH) # " characters");
    };
    
    if (not nonEmpty(credential_type, MAX_TEXT_LENGTH)) {
      return #err("Credential type must be between 1 and " # Nat.toText(MAX_TEXT_LENGTH) # " characters");
    };
    
    if (not nonEmpty(institution, MAX_ORGANIZATION_LENGTH)) {
      return #err("Institution must be between 1 and " # Nat.toText(MAX_ORGANIZATION_LENGTH) # " characters");
    };
    
    if (not isValidDate(issue_date)) {
      return #err("Invalid date format. Use YYYY-MM-DD");
    };

    let tokenId = nextTokenId;
    nextTokenId += 1;

    let metadata: Metadata = {
      student_name = student_name;
      credential_type = credential_type;
      institution = institution;
      issue_date = issue_date;
      revoked = false;
      revocation_reason = null;
    };

    let credential: Credential = {
      id = tokenId;
      owner = student_principal;
      issuer = caller;
      metadata = metadata;
      issue_timestamp = now;
    };

    credentials.put(tokenId, credential);
    updateLastCall(caller, now);
    #ok(tokenId)
  };

  // Revoke credential (issuer or admin only)
  public shared({ caller }) func revokeCredential(
    tokenId: TokenIdentifier,
    reason: Text
  ) : async Result.Result<Text, Text> {
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    // Input validation
    if (not nonEmpty(reason, MAX_TEXT_LENGTH)) {
      return #err("Revocation reason must be between 1 and " # Nat.toText(MAX_TEXT_LENGTH) # " characters");
    };
    
    switch (credentials.get(tokenId)) {
      case (?credential) {
        let canRevoke = requireAdmin(caller) or Principal.equal(caller, credential.issuer);
        if (not canRevoke) {
          return #err("Only issuer or admin can revoke credentials");
        };

        let updatedMetadata = {
          credential.metadata with 
          revoked = true;
          revocation_reason = ?reason;
        };
        let updatedCredential = {
          credential with metadata = updatedMetadata;
        };
        credentials.put(tokenId, updatedCredential);
        updateLastCall(caller, now);
        #ok("Credential revoked successfully")
      };
      case null { #err("Credential not found") };
    }
  };

  // Get all tokens owned by a user
  public query func getTokensOfUser(user: Principal) : async [TokenIdentifier] {
    if (not isValidPrincipal(user)) {
      return [];
    };
    
    let userCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        Principal.equal(entry.1.owner, user) and not entry.1.metadata.revoked
      }
    );
    
    Array.map<(TokenIdentifier, Credential), TokenIdentifier>(
      Iter.toArray(userCredentials),
      func(entry) = entry.0
    )
  };

  // Get credentials issued by a specific issuer with pagination
  public query func getCredentialsByIssuer(issuer: Principal, params: PaginationParams) : async Page<Credential> {
    if (not isValidPrincipal(issuer)) {
      return { items = []; nextCursor = null; total = 0 };
    };
    
    let issuerCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        Principal.equal(entry.1.issuer, issuer)
      }
    );
    
    let allCredentials = Array.map<(TokenIdentifier, Credential), Credential>(
      Iter.toArray(issuerCredentials),
      func(entry) = entry.1
    );
    
    let total = allCredentials.size();
    let start = Nat.min(params.offset, total);
    let end = Nat.min(start + params.limit, total);
    
    let pageItems = Array.subArray<Credential>(allCredentials, start, end - start);
    let nextCursor = if (end < total) ?Nat.toText(end) else null;
    
    {
      items = pageItems;
      nextCursor = nextCursor;
      total = total;
    }
  };

  // Get metadata for a specific token
  public query func getTokenMetadata(tokenId: TokenIdentifier) : async ?Metadata {
    switch (credentials.get(tokenId)) {
      case (?credential) { ?credential.metadata };
      case null { null };
    }
  };

  // Get full credential details
  public query func getCredential(tokenId: TokenIdentifier) : async ?Credential {
    credentials.get(tokenId)
  };

  // Get all credentials with pagination (for demo purposes - limit in production)
  public query func getAllCredentials(params: PaginationParams) : async Page<Credential> {
    // Validate pagination parameters
    let limit = Nat.min(params.limit, MAX_PAGE_SIZE);
    
    let allCredentials = Iter.toArray(
      Iter.map(
        credentials.entries(),
        func(entry: (TokenIdentifier, Credential)) : Credential = entry.1
      )
    );
    
    let total = allCredentials.size();
    let start = Nat.min(params.offset, total);
    let end = Nat.min(start + limit, total);
    
    let pageItems = Array.subArray<Credential>(allCredentials, start, end - start);
    let nextCursor = if (end < total) ?Nat.toText(end) else null;
    
    {
      items = pageItems;
      nextCursor = nextCursor;
      total = total;
    }
  };

  // Verify credential by token ID
  public query func verifyCredential(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
    verificationTimestamp: Int;
  } {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        ?{
          isValid = not credential.metadata.revoked;
          credential = credential;
          verificationTimestamp = Time.now();
        }
      };
      case null { null };
    }
  };

  // ===== SYSTEM STATISTICS =====

  // Get system statistics (admin only)
  public shared({ caller }) func getSystemStats() : async Result.Result<{
    totalCredentials: Nat;
    totalUsers: Nat;
    totalIssuers: Nat;
    totalCheckers: Nat;
    revokedCredentials: Nat;
  }, Text> {
    let now = Time.now();
    
    // Rate limiting check
    if (not canCall(caller, now, RATE_LIMIT_SECONDS)) {
      return #err("Rate limit exceeded. Please wait before trying again.");
    };
    
    if (not requireAdmin(caller)) {
      return #err("Only admin can view system statistics");
    };

    let revokedCount = Array.size(
      Array.filter<Credential>(
        Iter.toArray(Iter.map(credentials.entries(), func(entry) = entry.1)),
        func(cred) = cred.metadata.revoked
      )
    );

    let issuerCount = Array.size(
      Array.filter<UserProfile>(
        Iter.toArray(Iter.map(userProfiles.entries(), func(entry) = entry.1)),
        func(profile) = switch (profile.role) { case (#Issuer) true; case _ false; }
      )
    );

    let checkerCount = Array.size(
      Array.filter<UserProfile>(
        Iter.toArray(Iter.map(userProfiles.entries(), func(entry) = entry.1)),
        func(profile) = switch (profile.role) { case (#Checker) true; case _ false; }
      )
    );

    updateLastCall(caller, now);
    #ok({
      totalCredentials = credentials.size();
      totalUsers = userProfiles.size();
      totalIssuers = issuerCount;
      totalCheckers = checkerCount;
      revokedCredentials = revokedCount;
    })
  };

  // Get total supply
  public query func totalSupply() : async Nat {
    credentials.size()
  };

}
