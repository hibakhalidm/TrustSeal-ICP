import { ActorSubclass } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

export interface _SERVICE {
  mint: (
    student_name: string,
    credential_type: string,
    institution: string,
    issue_date: string
  ) => Promise<{ ok?: bigint; err?: string }>;
  
  getTokensOfUser: (user: Principal) => Promise<Array<bigint>>;
  
  getTokenMetadata: (tokenId: bigint) => Promise<
    [] | [{
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
    }]
  >;
  
  getCredential: (tokenId: bigint) => Promise<
    [] | [{
      id: bigint;
      owner: Principal;
      metadata: {
        student_name: string;
        credential_type: string;
        institution: string;
        issue_date: string;
      };
    }]
  >;
  
  getAllCredentials: () => Promise<Array<{
    id: bigint;
    owner: Principal;
    metadata: {
      student_name: string;
      credential_type: string;
      institution: string;
      issue_date: string;
    };
  }>>;
  
  verifyCredential: (tokenId: bigint) => Promise<
    [] | [{
      isValid: boolean;
      credential: {
        id: bigint;
        owner: Principal;
        metadata: {
          student_name: string;
          credential_type: string;
          institution: string;
          issue_date: string;
        };
      };
    }]
  >;
  
  totalSupply: () => Promise<bigint>;
}

export declare const trustseal_backend: ActorSubclass<_SERVICE>;
export declare const canisterId: string;
export declare const createActor: (canisterId: string, options?: any) => ActorSubclass<_SERVICE>;