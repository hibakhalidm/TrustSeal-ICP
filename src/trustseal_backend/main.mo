import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Option "mo:base/Option";

actor TrustSealBackend {

  // Types based on DIP721 standard
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

  // Storage
  private stable var nextTokenId: Nat = 0;
  private stable var credentialsEntries: [(TokenIdentifier, Credential)] = [];
  private stable var userProfilesEntries: [(Principal, UserProfile)] = [];
  private var credentials = HashMap.HashMap<TokenIdentifier, Credential>(16, Nat.equal, Nat.hash);
  private var userProfiles = HashMap.HashMap<Principal, UserProfile>(16, Principal.equal, Principal.hash);
  
  // Default admin principal (set during deployment)
  private stable var adminPrincipal: ?Principal = null;

  // System upgrade hooks
  system func preupgrade() {
    credentialsEntries := Iter.toArray(credentials.entries());
    userProfilesEntries := Iter.toArray(userProfiles.entries());
  };

  system func postupgrade() {
    credentialsEntries := [];
    userProfilesEntries := [];
  };

  // Initialize admin (call once after deployment)
  public shared({ caller }) func initializeAdmin() : async Result.Result<Text, Text> {
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
          registration_date = Time.now();
          last_login = ?Time.now();
        };
        userProfiles.put(caller, adminProfile);
        #ok("Admin initialized successfully")
      };
    }
  };

  // Check if caller is admin
  private func isAdmin(caller: Principal) : Bool {
    switch (adminPrincipal) {
      case (?admin) { Principal.equal(caller, admin) };
      case null { false };
    }
  };

  // Check if caller is verified issuer
  private func isVerifiedIssuer(caller: Principal) : Bool {
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

  // Register new user (admin only or self-registration for checkers)
  public shared({ caller }) func registerUser(
    userPrincipal: Principal,
    role: UserRole,
    name: Text,
    organization: Text
  ) : async Result.Result<Text, Text> {
    
    // Check permissions
    let canRegister = switch (role) {
      case (#Admin) { isAdmin(caller) };
      case (#Issuer) { isAdmin(caller) };
      case (#Checker) { isAdmin(caller) or Principal.equal(caller, userPrincipal) };
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
          verified = isAdmin(caller); // Admin registrations are auto-verified
          registration_date = Time.now();
          last_login = null;
        };
        userProfiles.put(userPrincipal, profile);
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
    if (not isAdmin(caller)) {
      return #err("Only admin can verify users");
    };

    switch (userProfiles.get(userPrincipal)) {
      case (?profile) {
        let updatedProfile = {
          profile with verified = true;
        };
        userProfiles.put(userPrincipal, updatedProfile);
        #ok("User verified successfully")
      };
      case null { #err("User not found") };
    }
  };

  // Update last login
  public shared({ caller }) func updateLastLogin() : async Result.Result<Text, Text> {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile = {
          profile with last_login = ?Time.now();
        };
        userProfiles.put(caller, updatedProfile);
        #ok("Login updated")
      };
      case null { #err("User not found") };
    }
  };

  // Get all users (admin only)
  public shared({ caller }) func getAllUsers() : async Result.Result<[UserProfile], Text> {
    if (not isAdmin(caller)) {
      return #err("Only admin can view all users");
    };
    
    let allUsers = Iter.toArray(
      Iter.map(
        userProfiles.entries(),
        func(entry: (Principal, UserProfile)) : UserProfile = entry.1
      )
    );
    #ok(allUsers)
  };

  // Mint a new credential NFT (verified issuers only)
  public shared({ caller }) func mint(
    student_principal: Principal,
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
  ) : async Result.Result<TokenIdentifier, Text> {
    
    if (not isVerifiedIssuer(caller)) {
      return #err("Only verified issuers can mint credentials");
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
      issue_timestamp = Time.now();
    };

    credentials.put(tokenId, credential);
    #ok(tokenId)
  };

  // Revoke credential (issuer or admin only)
  public shared({ caller }) func revokeCredential(
    tokenId: TokenIdentifier,
    reason: Text
  ) : async Result.Result<Text, Text> {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        let canRevoke = isAdmin(caller) or Principal.equal(caller, credential.issuer);
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
        #ok("Credential revoked successfully")
      };
      case null { #err("Credential not found") };
    }
  };

  // Get all tokens owned by a user
  public query func getTokensOfUser(user: Principal) : async [TokenIdentifier] {
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

  // Get credentials issued by a specific issuer
  public query func getCredentialsByIssuer(issuer: Principal) : async [Credential] {
    let issuerCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        Principal.equal(entry.1.issuer, issuer)
      }
    );
    
    Array.map<(TokenIdentifier, Credential), Credential>(
      Iter.toArray(issuerCredentials),
      func(entry) = entry.1
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

  // Get all credentials (for demo purposes - limit in production)
  public query func getAllCredentials() : async [Credential] {
    Iter.toArray(
      Iter.map(
        credentials.entries(),
        func(entry: (TokenIdentifier, Credential)) : Credential = entry.1
      )
    )
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

  // Get system statistics (admin only)
  public shared({ caller }) func getSystemStats() : async Result.Result<{
    totalCredentials: Nat;
    totalUsers: Nat;
    totalIssuers: Nat;
    totalCheckers: Nat;
    revokedCredentials: Nat;
  }, Text> {
    if (not isAdmin(caller)) {
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
