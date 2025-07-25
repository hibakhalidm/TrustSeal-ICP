import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Option "mo:base/Option";

actor TrustSealBackend {

  // Types
  public type TokenIdentifier = Nat;
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

  public type IssuerInfo = {
    principal: Principal;
    name: Text;
    verified: Bool;
    registration_date: Int;
    public_key: ?Blob; // For signature verification
  };

  public type CheckerInfo = {
    principal: Principal;
    organization: Text;
    verified: Bool;
    registration_date: Int;
    verification_count: Nat;
  };
  
  public type Metadata = {
    student_name: Text;
    credential_type: Text;
    institution: Text;
    issue_date: Text;
    issued_timestamp: Int;
  };

  public type Credential = {
    id: TokenIdentifier;
    owner: Principal;
    issuer: Principal;
    metadata: Metadata;
    signature: ?Blob; // Digital signature from issuer
    is_revoked: Bool;
  };

  public type IssuerStats = {
    total_issued: Nat;
    verified_issuer: Bool;
    registration_date: Int;
  };

  // Admin principal (canister deployer)
  private stable var admin: Principal = Principal.fromText("2vxsx-fae"); // placeholder
  
  // Storage
  private stable var nextTokenId: Nat = 0;
  private stable var credentialsEntries: [(TokenIdentifier, Credential)] = [];
  private stable var issuersEntries: [(Principal, IssuerInfo)] = [];
  private stable var userProfilesEntries: [(Principal, UserProfile)] = [];
  private stable var checkersEntries: [(Principal, CheckerInfo)] = [];
  
  private func tokenHash(id: TokenIdentifier) : Hash.Hash { 
    Text.hash(Nat.toText(id))
  };
  private func principalHash(p: Principal) : Hash.Hash { 
    Text.hash(Principal.toText(p)) 
  };
  
  private var credentials = HashMap.HashMap<TokenIdentifier, Credential>(16, Nat.equal, tokenHash);
  private var authorizedIssuers = HashMap.HashMap<Principal, IssuerInfo>(16, Principal.equal, principalHash);
  private var userProfiles = HashMap.HashMap<Principal, UserProfile>(16, Principal.equal, principalHash);
  private var authorizedCheckers = HashMap.HashMap<Principal, CheckerInfo>(16, Principal.equal, principalHash);

  // System upgrade hooks
  system func preupgrade() {
    credentialsEntries := Iter.toArray(credentials.entries());
    issuersEntries := Iter.toArray(authorizedIssuers.entries());
    userProfilesEntries := Iter.toArray(userProfiles.entries());
    checkersEntries := Iter.toArray(authorizedCheckers.entries());
  };

  system func postupgrade() {
    // Restore credentials
    for ((tokenId, credential) in credentialsEntries.vals()) {
      credentials.put(tokenId, credential);
    };
    credentialsEntries := [];
    
    // Restore issuers
    for ((principal, info) in issuersEntries.vals()) {
      authorizedIssuers.put(principal, info);
    };
    issuersEntries := [];
    
    // Restore user profiles
    for ((principal, profile) in userProfilesEntries.vals()) {
      userProfiles.put(principal, profile);
    };
    userProfilesEntries := [];
    
    // Restore checkers
    for ((principal, info) in checkersEntries.vals()) {
      authorizedCheckers.put(principal, info);
    };
    checkersEntries := [];
  };

  // Initialize admin (called once by deployer)
  public shared({ caller }) func initializeAdmin() : async Result.Result<Text, Text> {
    if (admin == Principal.fromText("2vxsx-fae")) {
      admin := caller;
      #ok("Admin initialized successfully")
    } else {
      #err("Admin already initialized")
    }
  };

  // Register a new issuer (admin only)
  public shared({ caller }) func registerIssuer(
    issuer_principal: Principal,
    institution_name: Text
  ) : async Result.Result<Text, Text> {
    if (caller != admin) {
      return #err("Only admin can register issuers");
    };
    
    let issuerInfo: IssuerInfo = {
      principal = issuer_principal;
      name = institution_name;
      verified = true;
      registration_date = Time.now();
      public_key = null; // Can be added later for advanced crypto
    };
    
    authorizedIssuers.put(issuer_principal, issuerInfo);
    #ok("Issuer registered successfully")
  };

  // Verify issuer status
  public query func isAuthorizedIssuer(issuer: Principal) : async Bool {
    switch (authorizedIssuers.get(issuer)) {
      case (?info) { info.verified };
      case null { false };
    }
  };

  // Get issuer information
  public query func getIssuerInfo(issuer: Principal) : async ?IssuerInfo {
    authorizedIssuers.get(issuer)
  };

  // Get all authorized issuers
  public query func getAllIssuers() : async [IssuerInfo] {
    Iter.toArray(
      Iter.map(
        authorizedIssuers.entries(),
        func(entry: (Principal, IssuerInfo)) : IssuerInfo = entry.1
      )
    )
  };

  // Secure mint function (only authorized issuers)
  public shared({ caller }) func mint(
    student_principal: Principal,
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
  ) : async Result.Result<TokenIdentifier, Text> {
    
    // Check if caller is authorized issuer
    switch (authorizedIssuers.get(caller)) {
      case null {
        return #err("Unauthorized: Only verified institutions can issue credentials");
      };
      case (?issuerInfo) {
        if (not issuerInfo.verified) {
          return #err("Issuer not verified");
        };
      };
    };
    
    let tokenId = nextTokenId;
    nextTokenId += 1;

    let metadata: Metadata = {
      student_name = student_name;
      credential_type = credential_type;
      institution = institution;
      issue_date = issue_date;
      issued_timestamp = Time.now();
    };

    let credential: Credential = {
      id = tokenId;
      owner = student_principal;
      issuer = caller;
      metadata = metadata;
      signature = null; // Could implement actual crypto signatures
      is_revoked = false;
    };

    credentials.put(tokenId, credential);
    #ok(tokenId)
  };

  // Revoke credential (issuer only)
  public shared({ caller }) func revokeCredential(tokenId: TokenIdentifier) : async Result.Result<Text, Text> {
    switch (credentials.get(tokenId)) {
      case null {
        #err("Credential not found")
      };
      case (?credential) {
        if (credential.issuer != caller and caller != admin) {
          return #err("Only the issuer or admin can revoke credentials");
        };
        
        let updatedCredential: Credential = {
          id = credential.id;
          owner = credential.owner;
          issuer = credential.issuer;
          metadata = credential.metadata;
          signature = credential.signature;
          is_revoked = true;
        };
        
        credentials.put(tokenId, updatedCredential);
        #ok("Credential revoked successfully")
      }
    }
  };

  // Get all tokens owned by a user
  public query func getTokensOfUser(user: Principal) : async [TokenIdentifier] {
    let userCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        entry.1.owner == user
      }
    );
    
    Array.map<(TokenIdentifier, Credential), TokenIdentifier>(
      Iter.toArray(userCredentials),
      func(entry) = entry.0
    )
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

  // Get all credentials (for demo purposes)
  public query func getAllCredentials() : async [Credential] {
    Iter.toArray(
      Iter.map(
        credentials.entries(),
        func(entry: (TokenIdentifier, Credential)) : Credential = entry.1
      )
    )
  };

  // Enhanced credential verification
  public query func verifyCredential(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
    issuer_verified: Bool;
    revocation_status: Text;
  } {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        let issuerVerified = switch (authorizedIssuers.get(credential.issuer)) {
          case (?issuerInfo) { issuerInfo.verified };
          case null { false };
        };
        
        let isValid = not credential.is_revoked and issuerVerified;
        let revocationStatus = if (credential.is_revoked) { "Revoked" } else { "Active" };
        
        ?{
          isValid = isValid;
          credential = credential;
          issuer_verified = issuerVerified;
          revocation_status = revocationStatus;
        }
      };
      case null { null };
    }
  };

  // Get issuer statistics
  public query func getIssuerStats(issuer: Principal) : async ?IssuerStats {
    switch (authorizedIssuers.get(issuer)) {
      case (?issuerInfo) {
        let totalIssued = Array.size(
          Array.filter<(TokenIdentifier, Credential)>(
            Iter.toArray(credentials.entries()),
            func(entry) = entry.1.issuer == issuer
          )
        );
        
        ?{
          total_issued = totalIssued;
          verified_issuer = issuerInfo.verified;
          registration_date = issuerInfo.registration_date;
        }
      };
      case null { null };
    }
  };

  // Get total supply
  public query func totalSupply() : async Nat {
    credentials.size()
  };

  // ========== USER MANAGEMENT FUNCTIONS ==========

  // Register user profile (admin only for initial setup, then self-registration with approval)
  public shared({ caller }) func registerUser(
    user_principal: Principal,
    name: Text,
    organization: Text,
    role: UserRole
  ) : async Result.Result<Text, Text> {
    // Only admin can register other users, or users can register themselves with Checker role
    if (caller != admin and (caller != user_principal or role != #Checker)) {
      return #err("Unauthorized: Only admin can register users with roles other than Checker");
    };
    
    let userProfile: UserProfile = {
      principal = user_principal;
      role = role;
      name = name;
      organization = organization;
      verified = if (caller == admin) { true } else { false }; // Admin-registered users are auto-verified
      registration_date = Time.now();
      last_login = null;
    };
    
    userProfiles.put(user_principal, userProfile);
    
    // Also register in role-specific storage
    switch (role) {
      case (#Issuer) {
        let issuerInfo: IssuerInfo = {
          principal = user_principal;
          name = organization;
          verified = userProfile.verified;
          registration_date = Time.now();
          public_key = null;
        };
        authorizedIssuers.put(user_principal, issuerInfo);
      };
      case (#Checker) {
        let checkerInfo: CheckerInfo = {
          principal = user_principal;
          organization = organization;
          verified = userProfile.verified;
          registration_date = Time.now();
          verification_count = 0;
        };
        authorizedCheckers.put(user_principal, checkerInfo);
      };
      case (#Admin) {
        // Admin role is system-level, no additional storage needed
      };
    };
    
    #ok("User registered successfully")
  };

  // Get user profile
  public query func getUserProfile(user: Principal) : async ?UserProfile {
    userProfiles.get(user)
  };

  // Update last login
  public shared({ caller }) func updateLastLogin() : async Result.Result<Text, Text> {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile: UserProfile = {
          principal = profile.principal;
          role = profile.role;
          name = profile.name;
          organization = profile.organization;
          verified = profile.verified;
          registration_date = profile.registration_date;
          last_login = ?Time.now();
        };
        userProfiles.put(caller, updatedProfile);
        #ok("Last login updated")
      };
      case null {
        #err("User profile not found")
      }
    }
  };

  // Get user role for routing to appropriate dashboard
  public query func getUserRole(user: Principal) : async ?UserRole {
    switch (userProfiles.get(user)) {
      case (?profile) { ?profile.role };
      case null { null };
    }
  };

  // Admin functions
  public shared({ caller }) func verifyUser(user: Principal) : async Result.Result<Text, Text> {
    if (caller != admin) {
      return #err("Only admin can verify users");
    };
    
    switch (userProfiles.get(user)) {
      case (?profile) {
        let updatedProfile: UserProfile = {
          principal = profile.principal;
          role = profile.role;
          name = profile.name;
          organization = profile.organization;
          verified = true;
          registration_date = profile.registration_date;
          last_login = profile.last_login;
        };
        userProfiles.put(user, updatedProfile);
        
        // Update role-specific storage
        switch (profile.role) {
          case (#Issuer) {
            switch (authorizedIssuers.get(user)) {
              case (?issuerInfo) {
                let updatedIssuer: IssuerInfo = {
                  principal = issuerInfo.principal;
                  name = issuerInfo.name;
                  verified = true;
                  registration_date = issuerInfo.registration_date;
                  public_key = issuerInfo.public_key;
                };
                authorizedIssuers.put(user, updatedIssuer);
              };
              case null { };
            };
          };
          case (#Checker) {
            switch (authorizedCheckers.get(user)) {
              case (?checkerInfo) {
                let updatedChecker: CheckerInfo = {
                  principal = checkerInfo.principal;
                  organization = checkerInfo.organization;
                  verified = true;
                  registration_date = checkerInfo.registration_date;
                  verification_count = checkerInfo.verification_count;
                };
                authorizedCheckers.put(user, updatedChecker);
              };
              case null { };
            };
          };
          case (#Admin) { };
        };
        
        #ok("User verified successfully")
      };
      case null {
        #err("User not found")
      }
    }
  };

  // Get all users (admin only)
  public query func getAllUsers() : async [UserProfile] {
    Iter.toArray(
      Iter.map(
        userProfiles.entries(),
        func(entry: (Principal, UserProfile)) : UserProfile = entry.1
      )
    )
  };

  // Get users by role (admin only)
  public query func getUsersByRole(role: UserRole) : async [UserProfile] {
    let filteredUsers = Iter.filter(
      userProfiles.entries(),
      func(entry: (Principal, UserProfile)) : Bool {
        entry.1.role == role
      }
    );
    
    Array.map<(Principal, UserProfile), UserProfile>(
      Iter.toArray(filteredUsers),
      func(entry) = entry.1
    )
  };

  // Register checker organization
  public shared({ caller }) func registerChecker(
    organization_name: Text
  ) : async Result.Result<Text, Text> {
    let checkerInfo: CheckerInfo = {
      principal = caller;
      organization = organization_name;
      verified = false; // Requires admin approval
      registration_date = Time.now();
      verification_count = 0;
    };
    
    authorizedCheckers.put(caller, checkerInfo);
    
    // Also create user profile
    let userProfile: UserProfile = {
      principal = caller;
      role = #Checker;
      name = "";
      organization = organization_name;
      verified = false;
      registration_date = Time.now();
      last_login = null;
    };
    
    userProfiles.put(caller, userProfile);
    
    #ok("Checker registration submitted for approval")
  };

  // Get all checkers
  public query func getAllCheckers() : async [CheckerInfo] {
    Iter.toArray(
      Iter.map(
        authorizedCheckers.entries(),
        func(entry: (Principal, CheckerInfo)) : CheckerInfo = entry.1
      )
    )
  };

  // Enhanced verification for checkers (tracks usage)
  public shared({ caller }) func verifyCredentialAsChecker(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
    issuer_verified: Bool;
    revocation_status: Text;
    verification_timestamp: Int;
  } {
    // Update checker verification count
    switch (authorizedCheckers.get(caller)) {
      case (?checkerInfo) {
        let updatedChecker: CheckerInfo = {
          principal = checkerInfo.principal;
          organization = checkerInfo.organization;
          verified = checkerInfo.verified;
          registration_date = checkerInfo.registration_date;
          verification_count = checkerInfo.verification_count + 1;
        };
        authorizedCheckers.put(caller, updatedChecker);
      };
      case null { };
    };
    
    // Perform verification
    switch (credentials.get(tokenId)) {
      case (?credential) {
        let issuerVerified = switch (authorizedIssuers.get(credential.issuer)) {
          case (?issuerInfo) { issuerInfo.verified };
          case null { false };
        };
        
        let isValid = not credential.is_revoked and issuerVerified;
        let revocationStatus = if (credential.is_revoked) { "Revoked" } else { "Active" };
        
        ?{
          isValid = isValid;
          credential = credential;
          issuer_verified = issuerVerified;
          revocation_status = revocationStatus;
          verification_timestamp = Time.now();
        }
      };
      case null { null };
    }
  };

  // Get checker statistics
  public query func getCheckerStats(checker: Principal) : async ?CheckerInfo {
    authorizedCheckers.get(checker)
  };

  // Dashboard data functions
  public query func getAdminDashboardData() : async {
    total_users: Nat;
    total_issuers: Nat;
    total_checkers: Nat;
    pending_verifications: Nat;
    total_credentials: Nat;
  } {
    let pendingUsers = Array.size(
      Array.filter<UserProfile>(
        Iter.toArray(
          Iter.map(
            userProfiles.entries(),
            func(entry: (Principal, UserProfile)) : UserProfile = entry.1
          )
        ),
        func(profile) = not profile.verified
      )
    );
    
    {
      total_users = userProfiles.size();
      total_issuers = authorizedIssuers.size();
      total_checkers = authorizedCheckers.size();
      pending_verifications = pendingUsers;
      total_credentials = credentials.size();
    }
  };

  // Get issuer dashboard data
  public query func getIssuerDashboardData(issuer: Principal) : async ?{
    issued_credentials: Nat;
    active_credentials: Nat;
    revoked_credentials: Nat;
    issuer_info: IssuerInfo;
  } {
    switch (authorizedIssuers.get(issuer)) {
      case (?issuerInfo) {
        let issuerCredentials = Array.filter<(TokenIdentifier, Credential)>(
          Iter.toArray(credentials.entries()),
          func(entry) = entry.1.issuer == issuer
        );
        
        let totalIssued = Array.size(issuerCredentials);
        let revokedCount = Array.size(
          Array.filter<(TokenIdentifier, Credential)>(
            issuerCredentials,
            func(entry) = entry.1.is_revoked
          )
        );
        
        ?{
          issued_credentials = totalIssued;
          active_credentials = totalIssued - revokedCount;
          revoked_credentials = revokedCount;
          issuer_info = issuerInfo;
        }
      };
      case null { null };
    }
  };

}
