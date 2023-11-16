import { SemaphoreSignaturePCDPackage } from "./semaPCD";

// Verify a Zupass PCD and return participant data
export async function verifyZupass(pcd: string) {
  const sigPCD = await SemaphoreSignaturePCDPackage.deserialize(pcd);

  console.log(`[ZUPASS] verifying ${sigPCD.type}`);
  if (!(await SemaphoreSignaturePCDPackage.verify(sigPCD))) {
    throw new Error("Invalid signature");
  }
  const signedMessage = sigPCD.claim.signedMessage;
  console.log(`[ZUPASS] verifying signed message ${signedMessage}`);
  const uuid = JSON.parse(signedMessage).uuid;
  console.log(`[ZUPASS] fetching user ${uuid}...`);
  const zupassUser = await requestUser(uuid);
  if (!zupassUser) {
    throw new Error(`user not found`);
  }
  if (zupassUser.commitment !== sigPCD.claim.identityCommitment) {
    throw new Error(`user commitment mismatch`);
  }

  return zupassUser;
}

async function requestUser(uuid: string) {
  const response = await fetch(`https://api.zupass.org/account/user/${uuid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status !== 200) return undefined;
  return (await response.json()) as ZupassUser;
}

interface ZupassUser {
  uuid: string;
  commitment: string;
  salt: string;
  email: string;
}
