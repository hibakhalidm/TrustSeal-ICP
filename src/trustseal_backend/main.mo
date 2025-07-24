import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Result "mo:base/Result";

actor TrustSealBackend {

  // Types based on DIP721 standard
  public type TokenIdentifier = Nat;
  public type Principal = Principal.Principal;
  
  public type Metadata = {
    student_name: Text;
    credential_type: Text;
    institution: Text;
    issue_date: Text;
  };

  public type Credential = {
    id: TokenIdentifier;
    owner: Principal;
    metadata: Metadata;
  };

  // Storage
  private stable var nextTokenId: Nat = 0;
  private stable var credentialsEntries: [(TokenIdentifier, Credential)] = [];
  private var credentials = HashMap.HashMap<TokenIdentifier, Credential>(16, Nat.equal, Nat.hash);
  
  // Authorized issuers (for demo purposes, allowing any caller)
  private stable var authorizedIssuers: [Principal] = [];

  // System upgrade hooks
  system func preupgrade() {
    credentialsEntries := Iter.toArray(credentials.entries());
  };

  system func postupgrade() {
    credentialsEntries := [];
  };

  // Mint a new credential NFT
  public shared({ caller }) func mint(
    student_name: Text,
    credential_type: Text,
    institution: Text,
    issue_date: Text
  ) : async Result.Result<TokenIdentifier, Text> {
    
    let tokenId = nextTokenId;
    nextTokenId += 1;

    let metadata: Metadata = {
      student_name = student_name;
      credential_type = credential_type;
      institution = institution;
      issue_date = issue_date;
    };

    let credential: Credential = {
      id = tokenId;
      owner = caller;
      metadata = metadata;
    };

    credentials.put(tokenId, credential);
    #ok(tokenId)
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

  // Verify credential by token ID
  public query func verifyCredential(tokenId: TokenIdentifier) : async ?{
    isValid: Bool;
    credential: Credential;
  } {
    switch (credentials.get(tokenId)) {
      case (?credential) {
        ?{
          isValid = true;
          credential = credential;
        }
      };
      case null { null };
    }
  };

  // Get total supply
  public query func totalSupply() : async Nat {
    credentials.size()
  };

}
