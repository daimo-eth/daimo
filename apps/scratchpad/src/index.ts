import { ProfileCache } from "@daimo/api/src/api/profile";
import { ForeignCoinIndexer } from "@daimo/api/src/contract/foreignCoinIndexer";
import { HomeCoinIndexer } from "@daimo/api/src/contract/homeCoinIndexer";
import { NameRegistry } from "@daimo/api/src/contract/nameRegistry";
import { NoteIndexer } from "@daimo/api/src/contract/noteIndexer";
import { OpIndexer } from "@daimo/api/src/contract/opIndexer";
import { RequestIndexer } from "@daimo/api/src/contract/requestIndexer";
import { SwapClogMatcher } from "@daimo/api/src/contract/SwapClogMatcher";
import { DB } from "@daimo/api/src/db/db";
import { StubExternalApiCache } from "@daimo/api/src/db/externalApiCache";
import { getEnvApi } from "@daimo/api/src/env";
import { getViemClientFromEnv } from "@daimo/api/src/network/viemClient";
import { InviteGraph } from "@daimo/api/src/offchain/inviteGraph";
import { PaymentMemoTracker } from "@daimo/api/src/offchain/paymentMemoTracker";
import { Telemetry } from "@daimo/api/src/server/telemetry";
import { TokenRegistry } from "@daimo/api/src/server/tokenRegistry";
import {
  amountToDollars,
  baseUSDC,
  guessTimestampFromNum,
} from "@daimo/common";
import {
  daimoChainFromId,
  erc20ABI,
  nameRegistryProxyConfig,
} from "@daimo/contract";
import csv from "csvtojson";
import { dnsEncode } from "ethers/lib/utils";
import { Pool } from "pg";
import { Address, hexToBytes } from "viem";

import { chainConfig } from "./env";

main()
  .then(() => console.log("Done"))
  .catch(console.error);

async function main() {
  const accounts = [
    "0x0B46d1846E76F7075F92aB7A319840a789Bd14B2",
    "0xE7Dd0F2646aAC1da192C93CdC28B7524C7813E23",
    "0x7AC080bEB2ED79A2252801e2EAe1ed1992d6f8dD",
    "0x2b8f7a7AFF8acC8d20F73de519D23e1b6467fDe0",
    "0x2De491a833D935dF1dE72f9Ed3FF0bec374bce6E",
    "0x4378614B41d5FC0047950e0abcBbCAE04bbDE948",
    "0x0232837a7c54C2fb2C0B82881d5fA76d4c6A8695",
    "0xc94785BEE54f26b476780b3622f3AC83d006b969",
    "0xf3B5AEb41a0162BFDe068311b550CefAd26fA81e",
    "0x8df9Ee4a52107C229921e1c1cc1bbEAf9b536431",
    "0x73c729faAd641D945148919fb5d908Dd45Dd9bB7",
    "0x96F18C34fbb109394881634596208e12796Df1C7",
    "0x17e3D73446647AC86a97e9098A0CA5e9309F7876",
    "0x0F5fB0727800e7cFbDbc3C88a105915d1233AeCC",
    "0x3989932EC6183f7B77Ed217552AC3B61F696d38d",
    "0xe668e7e2Df2a32eFE54E0A0C9eA5316e4Afee6fD",
    "0x0245B8381764b62761D1c8bBc9E3C66352E728fD",
    "0x11Bb2999aed9e981f3C598aCA0d03BC07eB68fAb",
    "0xECC1BB09a43eF79DeCf5B38Aad076578e946BA63",
    "0x190a99Ab2B068f2656e43B5843F0CEf3E36dE039",
    "0xed5B8bb082A1904E2E8d6FF552b9898E3bC37530",
    "0x4AF4D3BB1c736De63db28d6A56c661206AF74618",
    "0x71C8dFfA1b70787e611109f72614587421c69dee",
    "0x218F5B7551B6942E67B1bb00853A84dB214a7629",
    "0xb81124204ADD3dfcbcC3870347865Aac5152e13F",
    "0x81e9dCb3b14417184B7e9BEE36d8264C098C15e8",
    "0x977bF3a4Ed15697214af136861cF7F1609f911Df",
    "0xF5C6Bd03996095be48980984e12b5ae774cca7Db",
    "0x7edBbdBc084c4d53A9bA3E252458118178Ee3910",
    "0xB7F8BF0e92FcDa21EEbfFf1D669D040946a438A7",
    "0x1d9c65211Ee9496e9E76823E4336eC01c702b6Bd",
    "0x3b2f0A5064173082b9f6A9D15F73Eccf1228ecB0",
    "0xb1AeAc01691A4D094B14d5a4f7580737d608050B",
    "0xC27FEEa72613d3BCB15b6fc0B70302eAcE140c88",
    "0x47181E79983d289B2b2C51Dee254788E5cf949E7",
    "0x000227E285dDc3146BF14037ccFb65f8413Ec789",
    "0x1E824B88ECd334974d0b7CfC817A9D301EF48CB3",
    "0x3c8c047030Fe4E6575Eb4635B3e919804dA4bE84",
    "0x9217C3746F43719ECc95505906b7BFA998B57315",
    "0x22F30f72214F729bdF11CF6064fc80798a0AAD17",
    "0x0C17e9baF1791f475b5276610B68bAdFd011459c",
    "0x3928C2C6792976F9b01982c1CB6DEf7Ef97e4DB4",
    "0xE89336d381cB47ed38a04A810e4fbFBf034691FE",
    "0xC63D91248652EBC13740044f0b11A00C3f58dbC8",
    "0x42de9d7cba82e3d6d1e3857f2B27C80277de7AF9",
    "0x06a0cfDf61CBF67A6dA4F236721266117816f4fA",
    "0xc3B3F2683350019e70C6199749a1888C28EFD3A7",
    "0x8Abb49CB9a77e83d8E81f67cDc23910fa3B814a8",
    "0x9aA4f5Ce34E981E19497E7040D2be0179191CFF9",
    "0x3bc16de781ecbFf89b7c5D57b73287CF8e054aCE",
    "0x8cC74D84182D3df9392A7286CA77a7099D91570C",
    "0x15eC7C709b875C57d67101E16eDfa09CB7773f12",
    "0xeb1d69b450663392803Aa24b1857BC8F0260F724",
    "0xC479EAE7bd04C796b36D8A24525759997660F7D5",
    "0xab855e3b534fb8a9879Bf2758942181D956bCC34",
    "0x7C513FF322076873a17EE1b02Fa388Ba4B780bF2",
    "0x20Acbc541813cBa32579dF69df91C5bB3044b5ab",
    "0x385A4263D8DE3D2Bde7Fd479538c7E70254b7Dff",
    "0xFADEDDf7ED9eD2a8BD651BA97494E3A3fA562068",
    "0x4E346046a566Ba7e5427E0260497d0D30b3d0a9C",
    "0x217c3dCd700055029Ca1cDb48dcf09AFA59deA01",
    "0xe02C18bD53e857b71c70189ba1e7EE176770a309",
    "0xF6AA228d21c13C858979C0dDe0cD48Acdd76cD8E",
    "0x36B89a251025e7FbEDA1Eb636e7C68Db2A42a8D3",
    "0x6133FCcf51E94302Db3D6E7d48B71b063ce08870",
    "0x672A4d459d4e1183153196aE81a8C5A50C7F572F",
    "0xA49BA01Ac669CCc7Dc5F01b12296fC2EdF466120",
    "0xa32aAA61a4cc530bD61c1a6F040a271EB0f73295",
    "0x268793942e873Ca4c908E0a086C93b6dAe50c74B",
    "0x633206feD7FCDFe1254eaAF74cb306020BeE4e68",
    "0xAC8B4169295FdeFe43244532b0F264DAAec44700",
    "0xa07Aa65e096f8Bd7e3692c01423b45dCCA372432",
    "0xF2F2f1F9aA7f0503B196Ac210646970c6AC1FE91",
    "0x3207961468b7ECC2D90FFAA0dFeB0a1623F58715",
    "0xbA9CCf2C595b009123212eD4C6Ecbf0Ca9768116",
    "0x73e6c304331B50d84fB7B691a876D283CB81bA77",
    "0x70dCb9782889692f7f49A0e916b894Cba6079Ab2",
    "0x9c013c189D2a7AD59A2Ee868bb25367C715d3262",
    "0x6A06ABA44F16F257B43b2cCd78a28Ee061fFF237",
    "0xeBd9aD0Da69FF06BcE922647986Bc02e564306b6",
    "0x727F6F41BC9b1DF908640607B2fC15dD17cF9EA7",
    "0x8778cF0490FEe9953EDAB3E68C50853c690E3329",
    "0x808BD8bfB269D299a3C94f5Ce5c33bf076823a9E",
    "0x9D5dEEb9F452AF89dB08887a23A0c3e6bBe2466F",
    "0x99c603e9bB0CFCf9cE6C3209cB22789C3eeC37c2",
    "0x85A673b5Ba8eA7245C5e410FdFEd862bc72fF793",
    "0x86B6C43A37414A74ca8215C25fF7BdA0C14fD518",
    "0xA8b079e2748B55A503295e48340c26387aC7295E",
    "0x1A63B998541F725215F4c80D1Fb6520E538Fe600",
    "0x4f847fe02923BAFAC3188b3709Ba0161F9d2eE9A",
    "0x55e5f167E030b75928dbcC2337C493aAc406c3B8",
    "0x54b98918bd33C153BFE3116e0646444f2aa10CF6",
    "0x6F4c8D7Fbc279094A87F38cD47089917452aDB7e",
    "0x4e1bB81F4088aeaEa5Ce6f41FB588D9e9c762CB0",
    "0x84FEE7126049aC81AE25482ABD62E25ce7206681",
    "0x9B93Cd38B09e161e51F00c2A4e0B881F51ABF37E",
    "0x3c09f8076aAfF01AC5F386Aaf16Dd6934ad7FfD4",
    "0x5a8ef2adFc72c4D2E06ab27e5e176CA959482DE2",
    "0x18d7319b20b7D41589dAFb306E37Df5262CA92e0",
    "0x2000Babb4208E8BD0b1D871f87B0e04fAC7bd302",
    "0x27aAE8ab0210fE0Aea0DB0EfEd1E4aA6Ee83C00C",
    "0x7c2De86ec1c261CEbAb8579bF5Cb057E457D8667",
    "0x96010F7B89CC2cf66463eAAAa256FE6f246A67AA",
    "0xBbf05909b5FDE2D730B7b1B094C2f97bd1Cfb243",
    "0x9A37a758D820F563f1a4137416659f93989b3d37",
    "0x3E77E30598ef2335f90Aa94976c47Fa74C5CeB70",
    "0x2c6fdD987889eB6a2F2A1e067995cbEe795f214f",
    "0x73eD07c5D45c865fc11cb12e0F8Cefb967594d19",
    "0x0aE29eCF974F18E80595e0ffb5E28741eD7548D2",
    "0x3523295FceE9753187511CEC658e636BcE85E4fA",
    "0x6d926c3A3c5Ea3086d26Eab47b840328Ef340FF0",
    "0x54260360A7AB5415FA75e7Ec641d21dbe22F2ee1",
    "0x2551a9e00FfAbe2f02a0Be059462708A303aB181",
    "0x83F063cEAE30734e12806E49569aBd995F2eFd57",
    "0xde8790568A8FE3571C15094849beF83129d1065a",
    "0x10937d60E9A16A3842B9977d9Ca52c9CaEC2c775",
    "0xB8e5D8b3352d7D9Adeb9dC947b7AFEC42D32a018",
    "0xD0486e42073954e0a985F6178D0571331eC4bd28",
    "0x1dF07fA604a1AE1F1a332Fa653d8880fe936fa4E",
    "0xe297dfD850EFE1603BC56274c130EDf43335bF3A",
    "0xC273f4E0c9cbF383B05f20af2A154FDCfD662224",
    "0x9e3c907e045F0cE1Db08C184E1Ca1C426E8e8325",
    "0xBecCcAE4f76D350c083D4fa0662EC73eaEF893C1",
    "0x4145A90a92cfAbFe39ADA7C8fe8c7e428721EC5e",
    "0x17253d6E45581c1E90482c004B15964cfd76203f",
    "0x01d0352B6df7074dC1959D69Af36aFC9b49d0520",
    "0xe694BbaB559C7d01fdBdA916f1E9033790670ce4",
    "0xCab8035C662836F803a10CE8BD213F780bEecC63",
    "0x7cBDE00BD00EB56D0029eB599CFfa838a0417452",
    "0x876A9a85Ed484748ca28bf9e8E1aF31F6Bb4e3C1",
    "0x751A3621F5C7A8032406f8b7aAA8A8b5A133e8a8",
    "0x6d4CAF0139F9F9436562651EfE001Ac3A50a5D22",
    "0x9Fc5744FB0BBe57cA32e23ED45B8Df913b877520",
    "0xE594952065799709cBf91df47FCbf40dC699D1f1",
    "0xdB983c2B77799f11D51bb1D1D2D9C9f6DA65a522",
    "0x3251a3dFbad1A474aaD2613939333AACF79484b6",
    "0xbe85561B7bBAF93eD99D8e0f23f02ed0d255090e",
    "0x8c14CE0da7C50B93EDBe0b616c7bAE86B7525391",
    "0x8e455717aD4b64A37C613eb40BB71Ed5FBD96B97",
    "0xAC77B7Eef8Ae13f5C9619129a76c25dd2f4e7B08",
    "0xc8Be4F7A5CdB42F1f9bDC983AF8B3b35aDf84846",
    "0x051C85E063FB5B0D871B04c5cA7866dEf3cFC1E6",
    "0x1DF43EC1Db99d3b19E5739a7Cc8A5ec72C34Cb98",
    "0x0d5f4476E90875E14b1Ee87a38eb1a8be6FE57C9",
    "0x6987cbDEa38C213D93976FF291dD667bC944Ab5C",
    "0x23763f38fD769930b6bbCb40D075578e795D78d8",
    "0x61E8Ff1D77f5fA40F1B49c87c9Ec1a2f34E2F383",
    "0x34fceebE0B778913a380588689172f168fA90674",
    "0xc71122a439BbCc2e06A09A66E5BC797C3D0068b8",
    "0x98DC2d9A12A7cc6Bb4e39bA4dd6977aeec12f376",
    "0xa2f0b2Cb4aDD7c881770F97E21D2fF34f1d2B0E4",
    "0x684007E77645E4267D3BDDA8a95df910718eC67c",
    "0x1EfE621Ed182282a60B638Abc33E43827A020605",
    "0xe2b1A7b0A42D2ef313987698e392EcAB89178AC1",
    "0xDFCfda21c21e35BD7b58a16e704194bd6a85103C",
    "0xd497a1F90a8547F53F9d886283a54bB3a696ddE7",
    "0x1A6175367D536114D73144c669Dcb2bcC9f2464f",
    "0x059E0dd09Ee9840C9A8524C04A71FbE8d96696B6",
    "0x235384C20668062bE175f5612f0901a1a22f5F3f",
    "0x825705f91DA6694901F5Cc73F11C5B40e12DdCCC",
    "0xc8c34df6a971Fb33DACB5B3cA585813abB414290",
  ] as Address[];
  await checkWhichAccountsDeployed(accounts);
}

async function checkWhichAccountsDeployed(addrs: Address[]) {
  const vc = getViemClientFromEnv(null as any, null as any);
  const dbShovel = new Pool({
    connectionString: getEnvApi().SHOVEL_DATABASE_URL,
  });

  const missing = [];
  for (const addr of addrs) {
    const bc = await vc.publicClient.getBytecode({ address: addr });
    if (bc == null) {
      missing.push(addr);
      console.log(`❌ no bytecode for ${addr}`);
    } else {
      const bal = await vc.publicClient.readContract({
        abi: erc20ABI,
        address: baseUSDC.token,
        functionName: "balanceOf",
        args: [addr],
      });
      const dollars = amountToDollars(bal);
      const res = await dbShovel.query(
        "select count(*) as n from erc20_transfers where f=$1",
        [hexToBytes(addr)]
      );
      const { n } = res.rows[0];
      console.log(`✅ ${bc.length}b code for ${addr}: $${dollars}, ${n} sends`);
    }
  }
  console.log(`${missing.length} addrs w/out bytecode:\n${missing.join("\n")}`);
}

function defaultDesc() {
  return `Scratchpad for quick tests`;
}

async function defaultScript() {
  console.log("Hello, world");

  let addr = "6152348912fb1e78c9037d83f9d4524d4a2988ed".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));

  addr = "179A862703a4adfb29896552DF9e307980D19285".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));

  addr = "179A862703a4adfb29896552DF9e307980D19286".toLowerCase();
  console.log(`addr ${addr} dnsEncode ` + dnsEncode(`${addr}.addr.reverse`));
}

function metricsDesc() {
  return `Print weekly Daimo usage metrics`;
}

async function metrics() {
  const vc = getViemClientFromEnv(new Telemetry(), new StubExternalApiCache());

  console.log(`[METRICS] using wallet ${vc.account.address}`);
  const db = new DB();
  const inviteGraph = new InviteGraph(db);
  const profileCache = new ProfileCache(vc, db);
  const nameReg = new NameRegistry(vc, inviteGraph, profileCache, new Set([]));
  const paymentMemoTracker = new PaymentMemoTracker(db);
  const tokenReg = new TokenRegistry();

  const swapClogMatcher = new SwapClogMatcher(tokenReg);
  const opIndexer = new OpIndexer(swapClogMatcher);
  const noteIndexer = new NoteIndexer(nameReg, opIndexer, paymentMemoTracker);
  const requestIndexer = new RequestIndexer(db, nameReg, paymentMemoTracker);
  const foreignCoinIndexer = new ForeignCoinIndexer(nameReg, vc, tokenReg);
  const coinIndexer = new HomeCoinIndexer(
    vc,
    opIndexer,
    noteIndexer,
    requestIndexer,
    foreignCoinIndexer,
    paymentMemoTracker,
    swapClogMatcher
  );

  console.log(`[METRICS] using ${vc.publicClient.chain.name}`);
  console.log(`[METRICS] compiling signups ${nameRegistryProxyConfig.address}`);
  const signups = new Map<string, number>();
  const daimoChain = daimoChainFromId(vc.publicClient.chain.id);
  for (const log of nameReg.logs.sort((a, b) => a.timestamp - b.timestamp)) {
    addMetric(signups, log.timestamp, 1);
  }

  const { tokenSymbol, tokenAddress } = chainConfig;
  console.log(`[METRICS] compiling ${tokenSymbol} transfers ${tokenAddress}`);
  const transfers = new Map<string, number>();
  coinIndexer.pipeAllTransfers(async (logs) => {
    for (const log of logs) {
      const from = nameReg.resolveDaimoNameForAddr(log.from);
      const to = nameReg.resolveDaimoNameForAddr(log.to);
      if (from == null && to == null) continue;
      const ts = guessTimestampFromNum(log.blockNumber!, daimoChain);
      addMetric(transfers, ts, 1);
    }
  });

  // Output CSV
  const csvLines = [["date", "signups", "transfers"].join(",")];
  const series = [signups, transfers];
  const dateSet = new Set(series.flatMap((s) => [...s.keys()]));
  const dates = [...dateSet].sort();
  for (const date of dates) {
    const values = series.map((s) => s.get(date) || 0);
    csvLines.push([date, ...values].join(","));
  }
  console.log(`\n${csvLines.join("\n")}\n`);
}

function addMetric(
  metrics: Map<string, number>,
  tsUnix: number,
  value: number
) {
  const week = getWeek(tsUnix * 1000);
  metrics.set(week, (metrics.get(week) || 0) + value);
}

// Returns eg 2023-09-24
function getWeek(tsMs: number): string {
  const date = new Date(tsMs);
  const sundayTs = tsMs - date.getUTCDay() * 24 * 60 * 60 * 1000;
  return new Date(sundayTs).toISOString().slice(0, 10);
}

function mailingListDesc() {
  return `Format BCC line for the mailing list`;
}

// Given a CSV file, extracts the name and email column and formats it.
async function mailingList() {
  const csvPath = process.argv[3];
  if (!csvPath) throw new Error("Usage: mailing-list <csv path>");

  const json = await csv().fromFile(csvPath);

  console.log("RECIPIENTS");
  const recipients = json
    .filter((row) => row["Email"].includes("@"))
    .map((row) => {
      const name = row["Name"];
      const email = row["Email"];
      console.log(`${name} <${email}>`);
      return email;
    });
  console.log("");

  console.log(`BCC ONLY\n${recipients.join(", ")}\n\n`);
}
