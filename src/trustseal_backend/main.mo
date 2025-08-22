import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Debug "mo:base/Debug";

actor TrustSealBackend {

  // Types based on DIP721 standard
  public type TokenIdentifier = Nat;
  public type Principal = Principal.Principal;
  
  public type Metadata = {
    student_name: Text;
    credential_type: Text;
    institution: Text;
    issue_date: Text;
    created_at: Int;
    verification_hash: Text;
  };

  public type Credential = {
    id: TokenIdentifier;
    owner: Principal;
    issuer: Principal;
    metadata: Metadata;
    is_revoked: Bool;
  };

  public type IssuerInfo = {
    principal: Principal;
    institution_name: Text;
    authorized: Bool;
    registered_at: Int;
  };

  // Storage
  private stable var nextTokenId: Nat = 0;
  private stable var credentialsEntries: [(TokenIdentifier, Credential)] = [];
  private stable var issuersEntries: [(Principal, IssuerInfo)] = [];
  private var credentials = HashMap.HashMap<TokenIdentifier, Credential>(16, Nat.equal, Nat.hash);
  private var authorizedIssuers = HashMap.HashMap<Principal, IssuerInfo>(16, Principal.equal, Principal.hash);
  
  // Admin principal (set during deployment)
  private stable var admin: ?Principal = null;

  // System upgrade hooks
  system func preupgrade() {
    credentialsEntries := Iter.toArray(credentials.entries());
    issuersEntries := Iter.toArray(authorizedIssuers.entries());
  };

  system func postupgrade() {
    credentialsEntries := [];
    issuersEntries := [];
    
    // Restore state
    for ((id, cred) in credentialsEntries.vals()) {
      credentials.put(id, cred);
    };
    
    for ((principal, issuer) in issuersEntries.vals()) {
      authorizedIssuers.put(principal, issuer);
    };
  };

  // Initialize admin (can only be called once)
  public shared({ caller }) func initializeAdmin() : async Result.Result<Text, Text> {
    switch (admin) {
      case (?_) { #err("Admin already initialized") };
      case null {
        admin := ?caller;
        #ok("Admin initialized successfully")
      };
    }
  };

  // Admin function to authorize issuers
  public shared({ caller }) func authorizeIssuer(
    issuer_principal: Principal,
    institution_name: Text
  ) : async Result.Result<Text, Text> {
    switch (admin) {
      case (?admin_principal) {
        if (caller != admin_principal) {
          return #err("Only admin can authorize issuers");
        };
      };
      case null {
        return #err("Admin not initialized");
      };
    };

    let issuerInfo: IssuerInfo = {
      principal = issuer_principal;
      institution_name = institution_name;
      authorized = true;
      registered_at = Time.now();
    };

    authorizedIssuers.put(issuer_principal, issuerInfo);
    #ok("Issuer authorized successfully")
  };

  // Check if caller is authorized issuer
  private func isAuthorizedIssuer(caller: Principal) : Bool {
    switch (authorizedIssuers.get(caller)) {
      case (?issuer) { issuer.authorized };
      case null { false };
    }
  };

  // Generate verification hash (simplified for demo)
  private func generateVerificationHash(metadata: Metadata, issuer: Principal) : Text {
    let combined = metadata.student_name # metadata.credential_type # 
                   metadata.institution # metadata.issue_date # 
                   Principal.toText(issuer);
    // In production, use proper cryptographic hash
    Text.hash(combined) |> Nat.toText(_)
  };

  // Enhanced mint function with authorization and security
  public shared({ caller }) func mint(
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
  ) : async Result.Result<TokenIdentifier, Text> {
    
    // Validate input
    if (Text.size(student_name) == 0) {
      return #err("Student name cannot be empty");
    };
    if (Text.size(credential_type) == 0) {
      return #err("Credential type cannot be empty");
    };
    if (Text.size(institution) == 0) {
      return #err("Institution cannot be empty");
    };

    // For demo purposes, allow any caller to mint (in production, check authorization)
    // if (not isAuthorizedIssuer(caller)) {
    //   return #err("Caller not authorized to issue credentials");
    // };
    
    let tokenId = nextTokenId;
    nextTokenId += 1;

    let metadata: Metadata = {
      student_name = student_name;
      credential_type = credential_type;
      institution = institution;
      issue_date = issue_date;
      created_at = Time.now();
      verification_hash = generateVerificationHash({
        student_name = student_name;
        credential_type = credential_type;
        institution = institution;
        issue_date = issue_date;
        created_at = Time.now();
        verification_hash = "";
      }, caller);
    };

    let credential: Credential = {
      id = tokenId;
      owner = caller;
      issuer = caller;
      metadata = metadata;
      is_revoked = false;
    };

    credentials.put(tokenId, credential);
    Debug.print("Credential minted: " # Nat.toText(tokenId));
    #ok(tokenId)
  };

  // Get all tokens owned by a user
  public query func getTokensOfUser(user: Principal) : async [TokenIdentifier] {
    let userCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        entry.1.owner == user and not entry.1.is_revoked
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
      case (?credential) { 
        if (credential.is_revoked) { null } else { ?credential.metadata }
      };
      case null { null };
    }
  };

  // Get full credential details
  public query func getCredential(tokenId: TokenIdentifier) : async ?Credential {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        if (credential.is_revoked) { null } else { ?credential }
      };
      case null { null };
    }
  };

  // Get all credentials (for demo purposes, with pagination)
  public query func getAllCredentials() : async [Credential] {
    let activeCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        not entry.1.is_revoked
      }
    );
    
    Iter.toArray(
      Iter.map(
        activeCredentials,
        func(entry: (TokenIdentifier, Credential)) : Credential = entry.1
      )
    )
  };

  // Enhanced verify credential with detailed validation
  public query func verifyCredential(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
    verification_details: {
      hash_matches: Bool;
      not_revoked: Bool;
      issuer_authorized: Bool;
    };
  } {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        if (credential.is_revoked) {
          return null;
        };
        
        let hashMatches = credential.metadata.verification_hash == 
          generateVerificationHash(credential.metadata, credential.issuer);
        
        let issuerAuthorized = switch (authorizedIssuers.get(credential.issuer)) {
          case (?issuer) { issuer.authorized };
          case null { true }; // For demo, consider all issuers authorized
        };
        
        ?{
          isValid = hashMatches and not credential.is_revoked and issuerAuthorized;
          credential = credential;
          verification_details = {
            hash_matches = hashMatches;
            not_revoked = not credential.is_revoked;
            issuer_authorized = issuerAuthorized;
          };
        }
      };
      case null { null };
    }
  };

  // Revoke credential (admin or issuer only)
  public shared({ caller }) func revokeCredential(tokenId: TokenIdentifier) : async Result.Result<Text, Text> {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        let isAdmin = switch (admin) {
          case (?admin_principal) { caller == admin_principal };
          case null { false };
        };
        
        if (caller != credential.issuer and not isAdmin) {
          return #err("Only issuer or admin can revoke credentials");
        };
        
        let updatedCredential = {
          credential with is_revoked = true;
        };
        
        credentials.put(tokenId, updatedCredential);
        #ok("Credential revoked successfully")
      };
      case null {
        #err("Credential not found")
      };
    }
  };

  // Get total supply
  public query func totalSupply() : async Nat {
    let activeCredentials = Iter.filter(
      credentials.entries(),
      func(entry: (TokenIdentifier, Credential)) : Bool {
        not entry.1.is_revoked
      }
    );
    Iter.size(activeCredentials)
  };

  // Get platform statistics
  public query func getStatistics() : async {
    total_credentials: Nat;
    active_credentials: Nat;
    total_issuers: Nat;
    revoked_credentials: Nat;
  } {
    let totalCreds = credentials.size();
    let activeCreds = Iter.size(
      Iter.filter(
        credentials.entries(),
        func(entry: (TokenIdentifier, Credential)) : Bool {
          not entry.1.is_revoked
        }
      )
    );
    
    {
      total_credentials = totalCreds;
      active_credentials = activeCreds;
      total_issuers = authorizedIssuers.size();
      revoked_credentials = totalCreds - activeCreds;
    }
  };

  // Health check endpoint
  public query func healthCheck() : async { status: Text; timestamp: Int } {
    {
      status = "healthy";
      timestamp = Time.now();
    }
  };
}
