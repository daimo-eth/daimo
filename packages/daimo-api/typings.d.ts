// Workaround until the following error is fixed in @semaphore-protocol:
// https://github.com/semaphore-protocol/semaphore/pull/452

declare module "@semaphore-protocol/group" {
  class Group {
    constructor(id: BigNumberish, treeDepth = 20, members: BigNumberish[] = []);
    get id(): BigNumberish;
    get root(): BigNumberish;
    get depth(): number;
    get zeroValue(): BigNumberish;
    get members(): BigNumberish[];
    indexOf(member: BigNumberish): number;
    addMember(member: BigNumberish);
    addMembers(members: BigNumberish[]);
    updateMember(index: number, member: BigNumberish);
    removeMember(index: number);
    generateMerkleProof(index: number): any;
  }
  export { Group };
}

declare module "@semaphore-protocol/proof" {
  export type PackedProof = any;
  export type SemaphoreProof = any;
  const generateProof: any;
  const verifyProof: any;
  export { generateProof, verifyProof };
}

declare module "@semaphore-protocol/identity" {
  export class Identity {
    constructor(identityOrMessage?: string);
    public get trapdoor(): bigint;
    public getTrapdoor(): bigint;
    public get nullifier(): bigint;
    public getNullifier(): bigint;
    public get secret(): bigint;
    public getSecret(): bigint;
    public get commitment(): bigint;
    public getCommitment(): bigint;
    public toString(): string;
  }
}
