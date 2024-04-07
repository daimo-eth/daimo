import { EAccount } from "@daimo/common";
import { Address } from "viem";

// A special Daimo invite link that shows a Farcaster frame.
export interface InviteFrameLink {
  // URL: https://daimo.com/frame/[id]
  id: number;
  owner: EAccount;

  bonusDollarsInvitee: number;
  bonusDollarsInviter?: number;

  auth: {
    mustBePowerUser?: boolean;
    fidMustBeBelow?: number;
    fidWhitelists?: {
      greeting: string;
      fids: number[];
    }[];
    addressWhitelists?: {
      greeting: string;
      addrs: Address[];
    }[];
  };

  appearance: {
    imgInit: string;
    imgSuccess: string;
    imgFail: string;
    buttonInit: string;
    buttonSuccess: string;
  };
}

export const inviteFrameLinks: InviteFrameLink[] = [
  {
    id: 1,
    owner: {
      addr: "0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D",
      name: "daimo",
      profilePicture:
        "https://daimo.com/profile/0xFBfa6A0D1F44b60d7CCA4b95d5a2CfB15246DB0D/pfp",
    },
    bonusDollarsInvitee: 4.84,
    auth: {
      fidMustBeBelow: 23000,
    },
    appearance: {
      imgInit: "/assets/frame/InvInitEarlyCaster.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "ᴇᴀʀʟʏ ᴄᴀsᴛᴇʀ? · ᴄʟᴀɪᴍ ɪɴᴠɪᴛᴇ",
      buttonSuccess: "ʏᴏᴜ'ʀᴇ ɪɴ 🟣 ᴛᴀᴘ ғᴏʀ ɪɴᴠɪᴛᴇ",
    },
  },

  {
    id: 2,
    owner: {
      addr: "0x4D350d99364634e07B01a9986662787DD3755F0A",
      name: "dcposch",
      profilePicture:
        "https://daimo.com/profile/0x4D350d99364634e07B01a9986662787DD3755F0A",
    },
    bonusDollarsInvitee: 13.37,
    auth: {
      fidWhitelists: [
        {
          greeting: "MILADY",
          fids: [
            78, 79, 102, 144, 206, 346, 358, 414, 536, 796, 913, 964, 995, 1011,
            1054, 1096, 1098, 1104, 1145, 1240, 1283, 1288, 1300, 1559, 1593,
            1644, 1793, 2294, 2295, 2310, 2590, 2724, 2987, 2993, 3136, 3220,
            3484, 3493, 3608, 3647, 3810, 3818, 4008, 4011, 4121, 4155, 4253,
            4262, 4277, 4525, 4566, 4686, 4719, 4726, 4790, 4871, 4893, 4948,
            5200, 5270, 5291, 5548, 5769, 5964, 6171, 6337, 6597, 6698, 6821,
            6821, 7101, 7112, 7258, 7487, 7647, 8037, 8113, 8511, 8751, 9173,
            9232, 9410, 9647, 9771, 9832, 10117, 10841, 10912, 11031, 11070,
            11548, 12565, 12986, 13050, 13267, 13455, 13637, 13999, 14070,
            15559, 16156, 16522, 16859, 16945, 18269, 18314, 18432, 18594,
            19570, 19793, 20368, 20376, 20583, 21009, 21578, 22867, 187720,
            188497, 189376, 189587, 191800, 191847, 191864, 196263, 210768,
            211281, 211389, 211696, 212159, 213244, 213334, 214701, 215130,
            216759, 217244, 217447, 221671, 226210, 227886, 229168, 230618,
            232954, 232962, 238043, 238213, 238464, 238680, 239389, 239419,
            240713, 241562, 241598, 242354, 242923, 243124, 243534, 244167,
            244183, 245570, 245933, 246191, 247765, 248622, 248701, 249757,
            252745, 254562, 262813, 263994, 264670, 264796, 267148, 268459,
            269577, 270488, 270637, 270669, 271129, 271318, 272467, 272576,
            273393, 273667, 273738, 274319, 274357, 274746, 275335, 275425,
            275762, 275923, 275958, 277146, 277244, 277808, 278484, 279165,
            279407, 280986, 281262, 281379, 282936, 282997, 283462, 283883,
            284448, 285438, 286317, 286594, 287169, 288216, 288449, 288659,
            289653, 293016, 293348, 293535, 293747, 294192, 296154, 297469,
            300511, 301721, 302780, 311352, 312657, 318178, 320037, 321239,
            322944, 328862, 329264, 329909, 332704, 337575, 341744, 345867,
            351266, 368592, 388594,
          ],
        },
        {
          greeting: "Shiny and Chromie 🌈",
          fids: [
            102, 139, 143, 207, 305, 389, 604, 722, 790, 834, 964, 1241, 1620,
            1743, 2366, 2724, 2729, 3027, 3095, 3287, 3441, 3630, 3830, 3915,
            3947, 4042, 4042, 4724, 4802, 4929, 5471, 5521, 5548, 5614, 6032,
            6066, 7483, 7611, 8138, 8929, 8987, 9163, 9280, 9410, 9433, 10276,
            11298, 11643, 11866, 11926, 12928, 13103, 13183, 13436, 13820,
            14161, 14240, 15516, 16037, 16206, 16713, 17085, 18561, 20299,
            20583, 23357, 188497, 189685, 193168, 196166, 207594, 210550,
            211272, 211875, 212118, 212849, 216178, 217341, 226244, 227204,
            231052, 235494, 236173, 240172, 240587, 243846, 245065, 245978,
            246835, 247362, 248339, 248360, 253205, 261305, 266778, 271129,
            271561, 273100, 274705, 275923, 277808, 279091, 283056, 283127,
            286517, 289269, 289720, 291799, 292562, 293868, 294913, 295671,
            300172, 302267, 308854, 311352, 317915, 320173, 321444, 323251,
            326957, 329264, 338117, 350970, 354867, 366146, 374879,
          ],
        },
        {
          greeting: "Punk found 🤘",
          fids: [
            3, 43, 81, 90, 94, 108, 132, 143, 172, 222, 294, 389, 785, 1011,
            1124, 1743, 2405, 2416, 2805, 3395, 3429, 3539, 3602, 3871, 3947,
            3973, 4042, 4048, 4262, 4372, 4501, 4816, 4989, 5336, 5486, 5542,
            5548, 5557, 5584, 5614, 5978, 6972, 6991, 7413, 7483, 8048, 8265,
            9280, 9832, 11028, 11031, 12170, 13690, 14161, 14240, 15512, 15516,
            15825, 16713, 16991, 20169, 20583, 20807, 22438, 23357, 189685,
            190045, 190121, 191475, 196166, 211272, 211875, 218648, 231052,
            231371, 238412, 238464, 240224, 240502, 240650, 243451, 243811,
            246170, 247362, 249409, 261305, 268245, 270298, 273100, 274705,
            276945, 277244, 278523, 278655, 279091, 280408, 281900, 282683,
            283056, 285675, 289720, 301694, 302267, 306599, 312785, 321188,
            321630, 326957, 338117, 343171, 354362, 363716,
          ],
        },
        {
          greeting: "⌐◨-◨ ⌐◨-◨ ⌐◨-◨",
          fids: [
            3, 8, 34, 54, 64, 143, 172, 194, 290, 472, 701, 734, 785, 803, 834,
            1894, 2494, 2618, 3539, 3602, 3642, 3710, 3712, 3713, 3734, 3764,
            3818, 3974, 4132, 4167, 4262, 4484, 5126, 5584, 9173, 9280, 10810,
            11031, 13364, 15516, 16277, 18560, 19530, 20087, 20228, 20413,
            23357, 190804, 196513, 210757, 212791, 213304, 226930, 230296,
            230941, 264069, 272456, 381619, 5, 8, 44, 49, 60, 64, 79, 87, 96,
            99, 101, 106, 114, 133, 139, 141, 144, 167, 169, 177, 194, 225, 235,
            269, 290, 303, 305, 325, 346, 347, 350, 358, 373, 379, 399, 427,
            436, 517, 523, 552, 617, 631, 639, 656, 657, 681, 701, 742, 776,
            799, 800, 803, 833, 834, 843, 855, 913, 916, 941, 963, 1010, 1022,
            1024, 1030, 1042, 1079, 1087, 1134, 1150, 1159, 1162, 1190, 1191,
            1240, 1301, 1306, 1348, 1374, 1384, 1397, 1408, 1436, 1473, 1480,
            1486, 1495, 1499, 1504, 1507, 1525, 1534, 1546, 1553, 1574, 1621,
            1643, 1668, 1692, 1734, 1753, 1767, 1812, 1841, 1890, 1894, 1943,
            2008, 2035, 2144, 2165, 2179, 2185, 2212, 2217, 2222, 2235, 2266,
            2326, 2352, 2392, 2480, 2491, 2494, 2526, 2558, 2603, 2606, 2608,
            2615, 2616, 2618, 2629, 2694, 2802, 2834, 2850, 2881, 2906, 2950,
            2987, 3087, 3096, 3143, 3151, 3220, 3236, 3261, 3441, 3488, 3493,
            3506, 3524, 3539, 3553, 3559, 3575, 3615, 3632, 3642, 3647, 3682,
            3694, 3700, 3710, 3726, 3734, 3751, 3764, 3808, 3818, 3827, 3831,
            3857, 3864, 3877, 3882, 3895, 3965, 3974, 4005, 4060, 4065, 4073,
            4083, 4132, 4167, 4179, 4196, 4199, 4204, 4216, 4243, 4269, 4284,
            4290, 4301, 4332, 4341, 4353, 4368, 4388, 4433, 4484, 4498, 4513,
            4524, 4542, 4567, 4570, 4715, 4724, 4727, 4741, 4795, 4865, 4901,
            4904, 4929, 4952, 4959, 4998, 5062, 5094, 5106, 5113, 5126, 5189,
            5288, 5309, 5335, 5355, 5376, 5483, 5519, 5521, 5543, 5557, 5587,
            5620, 5701, 5755, 5774, 5780, 5810, 5904, 5972, 6083, 6084, 6162,
            6227, 6268, 6570, 6590, 6740, 7025, 7308, 7370, 7462, 7468, 7584,
            7611, 7620, 7684, 7759, 7805, 7951, 7957, 8004, 8006, 8081, 8145,
            8152, 8318, 8520, 8555, 8645, 8716, 8872, 9173, 9280, 9290, 9363,
            9410, 9432, 9440, 9456, 9638, 9681, 9780, 9829, 9919, 9920, 9956,
            10045, 10051, 10250, 10298, 10414, 10732, 10745, 10810, 10819,
            10862, 10914, 11235, 11256, 11298, 11312, 11329, 11499, 11512,
            11574, 11596, 11707, 11742, 11746, 11831, 11851, 11998, 12065,
            12095, 12502, 12665, 12872, 12904, 12916, 12949, 13006, 13055,
            13116, 13345, 13377, 13432, 13560, 13656, 13718, 13870, 13917,
            13924, 13970, 13986, 14070, 14175, 14202, 14217, 14330, 14480,
            14850, 14904, 15434, 15492, 15516, 15653, 16041, 16088, 16192,
            16203, 16351, 16367, 16522, 16583, 16667, 16767, 16842, 17129,
            17838, 17838, 17975, 18295, 18445, 18597, 18758, 18914, 18931,
            19510, 19530, 19530, 19570, 19779, 19786, 20005, 20143, 20146,
            20147, 20148, 20180, 20209, 20231, 20241, 20273, 20416, 20603,
            20624, 20771, 20773, 20815, 20941, 20957, 20975, 21251, 21778,
            21818, 22789, 23366, 188645, 189693, 189745, 190135, 190534, 190804,
            191284, 191496, 191593, 191604, 191880, 192300, 192388, 193140,
            193300, 193776, 193911, 195414, 195515, 195941, 195996, 196067,
            196270, 196388, 196513, 196522, 199242, 210423, 210550, 210648,
            210671, 210794, 210912, 210938, 210950, 211250, 212868, 212986,
            213263, 213328, 215404, 215918, 217313, 218957, 227094, 227509,
            229929, 230924, 230965, 231173, 231571, 234321, 234558, 234940,
            235128, 236173, 236820, 238206, 238564, 238609, 238794, 241836,
            241862, 241868, 242861, 244301, 245041, 245420, 245789, 246523,
            246860, 247991, 248022, 248089, 248387, 248924, 251720, 260639,
            261305, 262439, 263477, 263648, 263943, 265256, 267716, 269868,
            270072, 270448, 270944, 271409, 271592, 272085, 273997, 274687,
            274712, 279091, 280869, 284004, 285138, 285979, 287801, 287874,
            293654, 293811, 294315, 294447, 299208, 299812, 299824, 299905,
            301492, 306063, 308814, 308870, 308903, 309063, 310213, 314277,
            317347, 320263, 326484, 326557, 328148, 331473, 335433, 335774,
            336349, 337007, 337618, 341401, 345103, 348420, 349958, 351583,
            360904, 361913, 364845, 372210, 374408, 374612, 374638, 374641,
            377609, 379787, 388213, 393467,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitPurpleCheck.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "🟣 purple check? · tap to enter 🏰",
      buttonSuccess: "",
    },
  },

  {
    id: 3,
    owner: {
      addr: "0x24576A8aEb571B91Ee62b02c36cE7C8Ad0D78EAc",
      name: "petra",
      profilePicture:
        "https://daimo.com/profile/0x24576A8aEb571B91Ee62b02c36cE7C8Ad0D78EAc/pfp",
    },
    bonusDollarsInvitee: 10,
    auth: {
      fidWhitelists: [
        {
          greeting: "Wassie Detected 🐧 ᴛᴀᴘ ғᴏʀ ɪɴᴠɪᴛᴇ",
          fids: [
            71, 102, 220, 636, 656, 750, 809, 1057, 1366, 1390, 1514, 1574,
            2103, 2215, 2494, 2689, 2724, 2757, 2779, 3240, 3446, 3734, 3862,
            3910, 4140, 4262, 4276, 4448, 4483, 4599, 4686, 4726, 4909, 4909,
            5519, 5769, 6097, 6156, 6337, 6440, 6688, 6724, 6837, 6934, 6949,
            6962, 7043, 7455, 7762, 7878, 7921, 8080, 8140, 8157, 8502, 9232,
            9412, 9669, 10168, 10218, 10696, 11129, 11211, 11278, 12493, 12588,
            12609, 12644, 12650, 12933, 13203, 13501, 14302, 14394, 14809,
            15339, 15427, 15656, 16131, 17040, 17235, 17470, 17599, 17642,
            17745, 17748, 17769, 17816, 18373, 18377, 18389, 18403, 18445,
            18464, 18562, 18934, 18937, 19064, 19126, 19793, 19832, 20231,
            20529, 20539, 20641, 20779, 20787, 20931, 21454, 21698, 21821,
            22119, 22121, 23357, 23475, 187879, 188111, 188380, 188497, 188545,
            188852, 189065, 189226, 191134, 191357, 191590, 191672, 191799,
            191991, 192045, 192353, 192355, 192367, 192398, 192687, 192701,
            192708, 192728, 192733, 192824, 192862, 192872, 192905, 192975,
            193250, 193291, 193346, 194507, 195992, 196247, 210917, 211068,
            211203, 211272, 211465, 211555, 211600, 211766, 215336, 217447,
            217558, 217751, 218066, 226244, 226530, 228687, 229168, 230457,
            234553, 234558, 237156, 237466, 237891, 238042, 238178, 238213,
            238402, 238403, 238488, 238488, 238624, 239419, 239972, 239973,
            240092, 240139, 240307, 240331, 240754, 240818, 240964, 241321,
            241341, 241649, 241929, 241991, 242107, 242645, 244345, 245525,
            245570, 245704, 245853, 246455, 246856, 246961, 247524, 248131,
            249721, 250427, 251973, 252437, 262629, 262813, 264635, 265671,
            265804, 266729, 267148, 267820, 268245, 268685, 268685, 270158,
            270926, 271129, 271291, 271705, 271800, 272085, 273002, 273093,
            274296, 274357, 274705, 274832, 274980, 275351, 275368, 276760,
            278558, 278661, 278807, 278812, 279086, 279165, 279210, 280602,
            282581, 283251, 283839, 284018, 285675, 286081, 286246, 286569,
            286569, 287815, 287861, 288092, 288216, 289457, 289988, 290259,
            291799, 292035, 294913, 297482, 301003, 304160, 306792, 307822,
            309125, 310829, 310992, 311352, 311827, 312991, 316316, 317915,
            318178, 319898, 320820, 322118, 322156, 324714, 336713, 338355,
            343032, 343596, 343627, 343638, 344061, 346245, 346953, 348254,
            348266, 349911, 351266, 352482, 354503, 358108, 360217, 361106,
            365708, 367789, 369999, 372841, 376744, 377439, 377929, 381611,
            382226, 384900, 384975, 385539, 387261, 387677, 389357, 389363,
            389638, 390027, 390849, 394520, 395263,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitWassie.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "♒️ Got Wassie? · Get daimo ✳️",
      buttonSuccess: "",
    },
  },

  {
    id: 4,
    owner: {
      addr: "0xA6802A84afA7eD535DC120b0aE813B1aBc2fA85A",
      name: "dylan",
      profilePicture:
        "https://daimo.com/profile/0xA6802A84afA7eD535DC120b0aE813B1aBc2fA85A/pfp",
    },
    bonusDollarsInvitee: 10,
    auth: {
      fidWhitelists: [
        {
          greeting: "FarCon Summit Pass ✅ ᴛᴀᴘ ғᴏʀ ɪɴᴠɪᴛᴇ",
          fids: [
            2, 3, 8, 12, 17, 18, 21, 24, 30, 56, 59, 60, 69, 99, 129, 133, 139,
            155, 194, 206, 239, 260, 302, 303, 311, 312, 315, 325, 347, 350,
            358, 363, 369, 412, 426, 431, 451, 457, 472, 473, 516, 521, 533,
            539, 548, 576, 577, 589, 616, 617, 647, 680, 702, 732, 733, 734,
            738, 771, 800, 834, 851, 922, 946, 964, 976, 1048, 1095, 1137, 1214,
            1236, 1285, 1287, 1298, 1315, 1317, 1325, 1338, 1349, 1355, 1356,
            1401, 1460, 1593, 1606, 1626, 1689, 1886, 1970, 1992, 2194, 2417,
            2420, 2433, 2600, 2745, 2802, 2842, 2898, 2904, 3017, 3206, 3306,
            3368, 3391, 3414, 3621, 3635, 3860, 3882, 3887, 4085, 4167, 4179,
            4256, 4285, 4327, 4373, 4375, 4407, 4415, 4423, 4461, 4564, 4612,
            4823, 5181, 5283, 5448, 5543, 5604, 5620, 5745, 5774, 5818, 5952,
            6023, 6162, 6351, 6731, 6806, 6841, 6862, 7143, 7657, 7715, 7732,
            7851, 7960, 8555, 8971, 9052, 9107, 9134, 9280, 9391, 10703, 11510,
            11528, 11711, 11835, 12031, 12152, 12256, 15983, 16066, 16085,
            16098, 16148, 16567, 16925, 17106, 19858, 20270, 20286, 20975,
            188133, 193334, 194107, 196388, 196898, 212130,
          ],
        },
        {
          greeting: "FarCon Community Pass ✅ ᴛᴀᴘ ғᴏʀ ɪɴᴠɪᴛᴇ",
          fids: [
            53, 75, 114, 138, 260, 309, 323, 341, 639, 738, 761, 989, 1104,
            1185, 1198, 1277, 1303, 1408, 1480, 1520, 1584, 1642, 1655, 2112,
            2240, 2364, 2526, 2723, 2755, 2759, 2834, 3096, 3108, 3435, 3457,
            3484, 3558, 3609, 3734, 4253, 4282, 4547, 4665, 4816, 4877, 4904,
            5179, 5309, 5498, 6111, 6473, 6500, 7787, 8439, 8637, 8971, 9051,
            9186, 9265, 10351, 10990, 11161, 11467, 11599, 12224, 12256, 12431,
            13418, 13495, 13901, 14225, 15633, 16088, 16405, 17106, 17223,
            18085, 18407, 190045, 193930, 195515, 211333, 211644, 213618,
            214212, 214447, 234616, 239023, 242139, 247238, 248032, 279454,
            282672, 285121, 294226, 349261,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitFarcon.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "♒️ coming to farcon? · get daimo ✳️",
      buttonSuccess: "",
    },
  },

  {
    id: 5,
    owner: {
      addr: "0xA6802A84afA7eD535DC120b0aE813B1aBc2fA85A",
      name: "dylan",
      profilePicture:
        "https://daimo.com/profile/0xA6802A84afA7eD535DC120b0aE813B1aBc2fA85A/pfp",
    },
    bonusDollarsInvitee: 10,
    auth: {
      fidWhitelists: [
        {
          greeting: "Purple Confirmed 🟣 ᴛᴀᴘ ғᴏʀ ɪɴᴠɪᴛᴇ",
          fids: [
            2, 3, 5, 27, 44, 66, 87, 96, 108, 114, 129, 143, 144, 194, 225, 239,
            280, 290, 294, 303, 311, 312, 315, 350, 358, 359, 369, 373, 377,
            378, 412, 429, 431, 451, 468, 472, 473, 485, 521, 528, 533, 557,
            576, 617, 636, 640, 680, 706, 714, 771, 828, 834, 882, 932, 1004,
            1042, 1062, 1067, 1079, 1097, 1190, 1197, 1214, 1241, 1283, 1285,
            1287, 1298, 1321, 1356, 1401, 1407, 1575, 1593, 1610, 1626, 1629,
            1631, 1657, 1689, 1706, 1727, 1781, 1797, 1886, 1970, 1983, 2126,
            2139, 2222, 2266, 2364, 2433, 2458, 2461, 2480, 2486, 2494, 2510,
            2513, 2588, 2615, 2714, 2736, 2777, 2802, 2898, 2998, 3017, 3027,
            3115, 3123, 3206, 3306, 3414, 3584, 3635, 3694, 3708, 3882, 3965,
            3993, 4013, 4044, 4085, 4134, 4163, 4167, 4215, 4216, 4253, 4256,
            4269, 4283, 4286, 4290, 4306, 4327, 4339, 4372, 4373, 4375, 4378,
            4415, 4434, 4461, 4469, 4564, 4565, 4567, 4612, 4639, 4665, 4715,
            4724, 4743, 4753, 4787, 4802, 4864, 4888, 4904, 4908, 4923, 4949,
            4954, 5091, 5181, 5283, 5289, 5309, 5317, 5431, 5448, 5582, 5583,
            5620, 5701, 5745, 5774, 5818, 5964, 6047, 6081, 6090, 6144, 6162,
            6227, 6351, 6422, 6500, 6561, 6669, 6791, 6804, 6806, 6815, 6862,
            6868, 6881, 7061, 7062, 7097, 7132, 7210, 7237, 7584, 7588, 7589,
            7657, 7660, 7664, 7715, 7759, 7808, 7960, 8004, 8113, 8168, 8220,
            8319, 8471, 8481, 8528, 8555, 8711, 8730, 8760, 8952, 8988, 9020,
            9052, 9055, 9107, 9111, 9135, 9230, 9391, 9548, 9581, 9710, 9768,
            9771, 9802, 9829, 9856, 10020, 10259, 10426, 10694, 10810, 10841,
            10981, 11123, 11161, 11205, 11434, 11528, 11617, 11645, 11650,
            11698, 11711, 11728, 11827, 11835, 11946, 12095, 12133, 12144,
            12254, 12256, 12335, 12912, 12915, 12990, 13229, 13267, 13474,
            13505, 13678, 13878, 13893, 13928, 13999, 14364, 14468, 14613,
            14626, 15492, 15881, 16043, 16295, 16296, 16467, 16598, 16948,
            17005, 17106, 17827, 17989, 18038, 18404, 18489, 18586, 19627,
            20140, 20360, 20618, 20925, 21180, 21308, 22469, 23489, 24070,
            24128, 187822, 187892, 188133, 189069, 189312, 189625, 189851,
            190218, 191770, 191771, 191775, 191817, 192311, 192373, 193334,
            193776, 194346, 196425, 196898, 210628, 210746, 210794, 214447,
            218957, 233242, 233574, 234552, 234616, 245265, 264163, 277193,
            372022, 374612,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitPurple.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "♒️ Got Purple? · Get Daimo ✳️",
      buttonSuccess: "",
    },
  },
  {
    id: 6,
    owner: {
      addr: "0x1B435597e117b4D2B757d154512A342a8fd4b41E",
      name: "linda",
      profilePicture:
        "https://daimo.com/profile/0x1B435597e117b4D2B757d154512A342a8fd4b41E/pfp",
    },
    bonusDollarsInvitee: 10,
    auth: {
      fidWhitelists: [
        {
          greeting: "BountyCaster Confirmed",
          fids: [
            2, 3, 9, 12, 26, 30, 37, 48, 50, 52, 54, 56, 59, 60, 88, 101, 129,
            133, 140, 155, 189, 191, 206, 239, 258, 299, 303, 306, 315, 325,
            347, 354, 369, 373, 378, 431, 451, 472, 473, 476, 488, 516, 518,
            528, 533, 546, 548, 557, 576, 602, 616, 617, 623, 639, 643, 656,
            680, 716, 725, 734, 738, 754, 762, 851, 951, 1002, 1038, 1095, 1172,
            1214, 1233, 1285, 1315, 1317, 1401, 1407, 1460, 1480, 1575, 1584,
            1593, 1606, 1610, 1626, 1631, 1689, 1693, 1734, 1735, 1743, 1887,
            1891, 1948, 1970, 1979, 2025, 2067, 2074, 2085, 2112, 2119, 2139,
            2194, 2201, 2210, 2211, 2215, 2217, 2236, 2240, 2251, 2357, 2364,
            2390, 2417, 2420, 2433, 2441, 2443, 2458, 2460, 2480, 2488, 2584,
            2689, 2745, 2777, 2802, 3010, 3048, 3112, 3147, 3164, 3206, 3306,
            3391, 3417, 3435, 3546, 3615, 3621, 3632, 3647, 3667, 3696, 3835,
            3842, 3854, 3966, 4044, 4085, 4109, 4124, 4253, 4256, 4280, 4327,
            4368, 4373, 4378, 4408, 4461, 4482, 4522, 4528, 4547, 4674, 4715,
            4743, 4923, 4949, 5016, 5062, 5106, 5173, 5254, 5283, 5494, 5543,
            5701, 5758, 5767, 5818, 5840, 5985, 6142, 6162, 6196, 6208, 6303,
            6536, 6546, 6741, 6801, 6806, 6815, 6945, 6986, 7061, 7085, 7097,
            7143, 7409, 7438, 7479, 7589, 7620, 7715, 7863, 7868, 7910, 7963,
            8004, 8109, 8145, 8149, 8208, 8220, 8244, 8268, 8371, 8432, 8587,
            8726, 8730, 8810, 8952, 9135, 9144, 9176, 9192, 9230, 9391, 9415,
            9507, 9528, 9548, 9611, 9700, 9933, 10096, 10174, 10391, 10580,
            10685, 10703, 10793, 10799, 10952, 10976, 11123, 11161, 11215,
            11441, 11448, 11512, 11528, 11632, 11696, 11747, 11835, 11889,
            11948, 12142, 12151, 12152, 12388, 12480, 12580, 12737, 12871,
            12915, 12991, 13082, 13161, 13179, 13188, 13237, 13267, 13283,
            13457, 13474, 13563, 13642, 13659, 13870, 13898, 13928, 14131,
            14176, 14859, 14879, 14909, 14942, 15164, 15381, 15590, 15651,
            15799, 15850, 16066, 16085, 16098, 16148, 16152, 16211, 16285,
            16286, 16379, 16522, 16567, 16877, 16963, 16969, 17195, 17283,
            17454, 17474, 17940, 18032, 18078, 18085, 18240, 18295, 18407,
            18489, 18586, 18661, 19074, 19129, 19327, 19412, 19465, 19526,
            19590, 19669, 19677, 19740, 19742, 19745, 19777, 20068, 20270,
            20278, 20384, 20388, 20394, 20458, 20559, 20701, 134054, 187961,
            188975, 189830, 189862, 191277, 191554, 191626, 191648, 191774,
            191780, 192141, 192336, 192564, 193158, 193631, 193787, 193805,
            193826, 193861, 194479, 195091, 195315, 195790, 195880, 196149,
            196176, 196293, 196648, 196967, 197007, 200788, 202270, 205891,
            206958, 207172, 207208, 208816, 210538, 210731, 211333, 211535,
            211541, 211644, 212863, 213019, 213144, 213310, 214447, 215625,
            218950, 221475, 222389, 222942, 225200, 226244, 228109, 230147,
            233254, 234321, 234658, 236171, 240688, 240698, 243719, 245035,
            247238, 248101, 248108, 248300, 248904, 252720, 254520, 262566,
            270504, 271142, 282119, 287639, 300898, 311229, 313517, 316167,
            318675, 321532, 323555, 325509, 332881, 333278, 334841, 337648,
            339302, 343593, 346395, 352011, 364615, 376106, 377557, 383799,
            384391, 388375, 389323, 8, 24, 40, 61, 66, 99, 194, 311, 312, 363,
            370, 409, 474, 539, 604, 625, 626, 706, 714, 722, 741, 761, 788,
            848, 932, 960, 1072, 1082, 1101, 1277, 1279, 1303, 1356, 1389, 1684,
            1715, 1797, 1812, 1841, 1992, 2007, 2558, 2588, 2608, 2615, 2696,
            2736, 3174, 3180, 3235, 3504, 3559, 3589, 3605, 3609, 3727, 3731,
            4134, 4167, 4415, 4434, 4707, 4790, 4804, 4823, 4826, 4943, 5602,
            5685, 5713, 5745, 5774, 5820, 5883, 6048, 6087, 6437, 6500, 6558,
            6791, 6821, 7384, 7548, 8050, 8113, 8405, 8515, 8531, 8801, 9140,
            9702, 10376, 10588, 10857, 10983, 11770, 12034, 12095, 12747, 12990,
            13484, 13596, 14069, 14088, 14597, 14736, 15466, 16110, 16189,
            16715, 17134, 17229, 17246, 18558, 18931, 19445, 19652, 20059,
            20286, 20685, 20832, 24128, 188910, 188933, 188955, 189312, 190081,
            190923, 191351, 191832, 193627, 193699, 196280, 196351, 210744,
            211159, 216023, 231569, 232972, 238394, 239292, 241573, 244350,
            280586, 283056, 288534, 292768, 333312, 348539,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitLinda.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "Using Bountycaster? · Get Daimo ✳️",
      buttonSuccess: "",
    },
  },
  {
    id: 7,
    owner: {
      addr: "0x689f16A76B14161B21dC3ae406D7e6C7C7978a9B",
      name: "ted",
      profilePicture: "",
    },
    bonusDollarsInvitee: 20,
    bonusDollarsInviter: 10,
    auth: {
      fidWhitelists: [
        {
          greeting: "🌴 WELCOME 🌴",
          fids: [
            56, 28, 99, 114, 260, 291, 426, 451, 518, 576, 589, 680, 771, 897,
            1180, 1214, 1236, 1285, 1298, 1401, 1733, 1918, 2201, 2420, 2745,
            2802, 3621, 3635, 4253, 4256, 4373, 5745, 5774, 6804, 6862, 7085,
            7795, 7960, 8971, 9135, 9230, 11279, 11510, 11528, 12256, 13465,
            14611, 16085, 16405, 16871, 20270, 20286, 191351, 195929, 204173,
            214447, 230238, 237845, 238307, 239328, 241408, 247238, 247238,
            252769, 270504, 284982, 311845, 316167, 325710, 328928, 331688,
          ],
        },
      ],
    },
    appearance: {
      imgInit: "/assets/frame/InvInitClubTed.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "Club Ted member? · Get Daimo ✳️",
      buttonSuccess: "",
    },
  },
  {
    id: 8,
    owner: {
      name: "ansgar",
      addr: "0xA1B349c566C44769888948aDC061ABCdB54497F7",
    },
    bonusDollarsInvitee: 15.59,
    appearance: {
      imgInit: "/assets/frame/InvInitAnsgar.png",
      imgSuccess: "/assets/frame/InvFrameSuccess.png",
      imgFail: "/assets/frame/InvFrameFail.png",
      buttonInit: "Protocol Guild? · Get Daimo ✳️",
      buttonSuccess: "",
    },
    auth: {
      addressWhitelists: [
        {
          greeting: "Welcome! Tap to redeem",
          addrs: [
            "0xc60A0A0E8bBc32DAC2E03030989AD6BEe45A874D",
            "0xEB34BD135aFc3054667ca74C9d19fbCD7D05F79F",
            "0x9Bee5b17Eb847744b6a81Ee935409739F91c722c",
            "0x6591e7D655f248f6930195385C36b8D5Af679B8B",
            "0x974B9cb3c122561e3bf6234651E0b82B88Fb9015",
            "0xE9F19B6C72219f9B12C9c367405a90Ac9aFb2241",
            "0x497f0D190C513f51eAC234628200a5E62271a7A5",
            "0x8b49Fb41E0dF3ea3D01aD9d06501BB5a2257cCB0",
            "0x797AbA41FD90740a2cA970d6706Af05aDe09335B",
            "0xbB3F2F946E8eE2912830e365cF241293636cb057",
            "0xdF6C53Df56f3992FC44195518A2d8B16306Af9ff",
            "0x299cB850bD75C07ef89978Bdc52e062Cc4fA0250",
            "0xBFbeaB0896E29d0Db26ad60278d3Ab3C482BB199",
            "0x8cbF722ADFBc071A12aAE158A12a68397578017c",
            "0xe019836A41CB707F79b991f60e241918097aC16e",
            "0xF51fc4c6Ab075482b61F5C1d4E72fADaFf8815F3",
            "0x3B16821A5dBBFF86E4a88eA0621EC6be016cd79A",
            "0x5973D1af5c13168bdC85c6e78309272815995Ffb",
            "0x9F60E4aF6020cc6a791B2d1Ce9902d25A72bA824",
            "0x6fFd2248Ab7E80ef51D7Eb4CB60964C830125567",
            "0x3212974a4E53E5238f6ea193B36412Db9AD61c26",
            "0x00a2d2d22F456125d64Beda5A6f37273A13d9DE0",
            "0x7c1c1C2DE344dcDd7db65E5D52C5E1Ea862C6139",
            "0x8894e499d6359F3A7955736794Ca9a0D536109Be",
            "0x1de6938d9f9ebd43D0Cc56f0CeF1657D954c9A94",
            "0x0000006916a87b82333f4245046623b23794C65C",
            "0x7e59Df833869E2997d05e163D6004f3344A052FA",
            "0xa87922d0074bCd82Ac82816633CcE68472548955",
            "0x05618d6EFFe2E522F07B1dB692d47A68bfD6fFEa",
            "0x75C7F1F73305BCF9f91222eff570D9c3C423e405",
            "0xdc871D2C0F92de79E5c1DAAeDDA1372e774f2eB6",
            "0xd20BebA9eFA30fB34aF93AF5c91C9a4d6854eAC4",
            "0x4843752dc23f6c28437979770cA710d0e13426e6",
            "0x50d5e44700c10873875b4E75C4c9396562D83bE1",
            "0x6B29132ea388a308578c1d3Be068D0e4fc9915a2",
            "0x24113fFB07189D1e6E169025A424B58C29522972",
            "0x6E22A5e30088C8389dC725BbeaD5f0675334299f",
            "0xD4a3030b5f5e8DD4860d370C17E8576aE9951a2D",
            "0x10ab73AA48D686b7FD9ec9D50418a14DD23f6631",
            "0xb7A593EC62dc447eef23ea0e0B4d5144ac75ABC5",
            "0x799681f9b9d7c55ed59f5a0f235cAb132Cde0a2B",
            "0x004f67dAbb603AAA58eD52641CCafF09C559704A",
            "0xe05875F287C028901798aC2Dc8C22Ba908b8eF36",
            "0xa29576F07eAaD050AeACbc89AC0518B62fe2F88E",
            "0x80Bb92f389591d353654ac5580baefF7d0d6e778",
            "0x92699d64C65c435D4a60E2ceEaEb931dB8B1cA09",
            "0x50B6A164ca5673BC6c5bF5E6D9F31587180bf8E7",
            "0xAE3bc9D0B8168B0eB27E4Ba237fcfFC25411c209",
            "0x46cD90445349e64F895c403c23839e79eb4065e4",
            "0xC6cA7c3427AD6B7a06fbED6D18C394E540E31814",
            "0xf363C519F91E823184061e5BF28263262E2b9B8d",
            "0x49Aa00072a7BA8a5639C43Fe9F6536820E6F5d57",
            "0xa1D76553266fA8Ed3D143794a462aaFAdfC34f74",
            "0x644177F8D79117c2b9C7596527642B3c2D05888E",
            "0xb721c2e6640D963e99b37B6437ABAF6914A25A5e",
            "0xbC349D1BEeE33c61F0395d1667E70056B4C869B9",
            "0xC152fd31F285f6c0B3807070280595e7Ea713a7f",
            "0xBc11295936Aa79d594139de1B2e12629414F3BDB",
            "0x4d5083DD10F2a46F26f5583c6679f9F8D30aE850",
            "0x9915C453cc779109013F1aF0c4639277e8257212",
            "0xFf9977FB117a22254a8eB6c6CE8d3Dd671FA70DC",
            "0xf71E9C766Cdf169eDFbE2749490943C1DC6b8A55",
            "0x3eD7bf997b7A91e9e8aB9eE2F7ce983bd37D6392",
            "0xCb8DC3beC7B659022aE0d3E9de17322F31e4AA7C",
            "0x84f678A3e7BA8Fc817c32Ff10884D6FB20976114",
            "0x2bf7b04F143602692bBDc3EcbeA68C2c65278eee",
            "0x5AC41B7E73680a3E77B941fEE0BAD04F59c9bB7d",
            "0xAb96014a7c078f09418Cf899Bf197CadFf023C16",
            "0x9258D14Db5AE79De3717dfb5F03c3f0A6fC71999",
            "0xf0443945aD3BE9645382FC2537317dA97FEfF3A9",
            "0x0760E844e6f368ce73F1eEB917d37Db19375De3B",
            "0x10c8597a5063A1648FfE13f54E996ba9bB3217B5",
            "0xf5441a1b900a1D93e4c06CB9c3fDbA39F01469f0",
            "0x50122A5509F628e901F9c0238F0168833753239b",
            "0x86F34D8b98171281AB8bFe65C7e2718E4f002e35",
            "0x200Ce476481a89AB7FF9b737393297AE08CE539B",
            "0x78ac9c2545850bEDbC076EB30ce7A6f0D74b395E",
            "0x3210287ddEe6ece40d17A1F39799239b972A81F2",
            "0x153afFb96Fcb60085Ee307996Bdd2df0183A3682",
            "0x661b81d462D80786c442774F452464A8C627a20E",
            "0xB7b93e217dd4E6E700E7362cB234d6258438D3b7",
            "0x2fb858991668840ce34F331402E0b3C66db078AF",
            "0x980a85ba6c2683e3509752dd3b4eB50165C0e65F",
            "0x9e7fa612eb6E771B0E918D94A0d524D6666Fa07E",
            "0x00cDD7Fc085c86D000c0D54b3CA6fE83A8a806e5",
            "0x0906Eb682C6d12EdBE5e0A43E60068E1A7F8bea3",
            "0xEd46bFFd4b8237a9c7E08f55F0B410544f989813",
            "0xe2A296b3d3AD4212b6030442e70419ff7B82FEE4",
            "0xBEDaD5f3bB658CC67eFDc9e8C17e6A82C1193eF1",
            "0xc66EFCcB88b3b7BdE6fC476d8cF139DD38075Ad7",
            "0xEB8E7c90014565EEd8126110630eFa2d9CD6eBE4",
            "0x046Fb65722E7b2455012BFEBf6177F1D2e9738D9",
            "0x3d5D2AC4fEcF16bb1651A445d5B17f977A823546",
            "0x975D1040E93316917BD67dD32a02e1929F8aF8D3",
            "0x5abAdE91eD4B6d11b666280CaCb3E4A32898f39B",
            "0x4Bfa4639Cc1f4554122aBB930Aa897CDAe90d13b",
            "0xd31461D449fBFB88DD8D4E7D8fCcF79389f671E9",
            "0x2f38617c9D8fc5863c5B3DE855d76CFb0B7Ab676",
            "0x8360470F1793C91c953be453fcA52CC63dfCb367",
            "0x71c15691e243bE88220957C784053EF0E084440B",
            "0x9b796F2de75772f1634D78A3AB23A03778D3702a",
            "0x66EE965FfC43D985633D04A044B47B7Ba8952EE1",
            "0x530ecA5D32C1bf2865327DF76f6dBc73dea1af5c",
            "0x5E5EF2c688E6CE34A1d4b4771780716fE06848FA",
            "0xc627a07F25c61244e0c72A2bCf52014015F469ff",
            "0x76097c0e5f2700592aa4132adb5eB59869364BD3",
            "0x232e6C4eb0882Fcf92865Dc1de98BcE2A56b6553",
            "0xC5A004f720FB103BD6Eb5de362115eB4986F635E",
            "0x88cc2a9882Dd3462702e56DF1B438FaC6E203d4A",
            "0xE1d0a84957B652f36769340C38944f1B97cF3e5E",
            "0x925F5d6cCdB04F56fBa1cdcAd92E4eBb0d421411",
            "0x7cC3E83CD74Df93FcC879EC7c905635eE6a6C233",
            "0x642373c947D2C2BED12CDE6D5da3dAb11d6323f1",
            "0x3b864e8588EB3c1c84169aEd272dAe21734b93cA",
            "0x456287fcC918525d664bB4F62C084BE4E85D019B",
            "0xf1DF831EF8dea686508bB27252Ea86F72c012181",
            "0xeF458C3fBC811912340D23AC5541839c7A7F3b08",
            "0xf67c7315391F9712bF04cFB8A72D450f42F9F576",
            "0x2D87c6679968a3A15b9B984a5d2C2ECe4B9cc7DC",
            "0xB61384c05086576ebD647C9217Ce0765Bd748bA1",
            "0x784B5955Fe452c67be9c2f594C73C284f55771e7",
            "0x5baf47751b4eeE90d7F9fd5EB75c3aD4162421E4",
            "0x5869C17c8934Ce9f674e88c7d4f8F94DCE193FCB",
            "0xFeD50d730C07a85cEC48Ac586e0372D7D536Eef0",
            "0x2952C5774fCcC6935Fe0F44Ed57c0E7B4ED94972",
            "0x579Fc2cd54b0cA848b180BBc8ACf45C54982eeC5",
            "0x554dcBaF9D1df74c195490d64E37eC0FdfED3c90",
            "0x9598CDBe860a1abD8863CFcdf1cfcd3E609c9eA9",
            "0x882337880eE78a7D32A069061994f619fd540F6d",
            "0xA3fD150da53b9B6F65eBb8210552DA9d56c32Bec",
            "0xd290c3691e8dC2C2E27120259F5E662F309aF612",
            "0xEB2FA209Be50FAe31948822b6AfD62292dD2463F",
            "0x79a05a48F73c34638B716ad06EfF5bCEA3425084",
            "0xD7ECB7fE6D5276773dE0A2317de2FF9Fde75fAD5",
            "0x27f672013538c9BBbE87EEbE6335302F68684DEf",
            "0xa55F4583b49c8f4A85cC5cdFce503807098509FA",
            "0xF821ec616fb20b8C53C043afe1122e5d4165A335",
            "0x5E1De79FC192618BBC85e62274b12aD0b48f6B3B",
            "0x32323265D9F3Df331ccaCf7Bd11135aF14776b69",
            "0xa1506f8DC05b1c22Ba23CBfd4625C68599196E91",
            "0x552D4145a79eC49Ad73Cf4aA413D0EBdf7fD0c96",
            "0x0CEFE7d96642a6A9e2c7E34ec1e431E4206D3a93",
            "0xab8b3647EF7FF66D2f38ee5eaEf2b158c4eb52A2",
            "0x48b76905b18c7c80e895bda18061a0E6842794F6",
            "0x78fC08517B0e7fD99F10afff5C3e07049Cd00989",
            "0xC9187b5C81d63b289811A4fcb9AC7ADb7103639e",
            "0x1faA4E309eA6DECE1aCC4D0e5Fe432e2c1148Ec2",
            "0x5684435fea165b1cDCBdfbdc39287F7929C6C055",
            "0x3d981E55BF4b8Be8E0d6545E6bA6A140c2ab206A",
            "0x3ed9D598b2099d99e9e49B1697729027C67926d2",
            "0x0aD5D1F88a6c27f1eA4e3f45bE0F4751baFc26C5",
            "0x31e4B877B9033fcc355aF129Fcd387031007BBf0",
            "0x6a5ec9D4a8E5bbb0F7fD04658E088B4c636d7F15",
            "0x41fb20055464819f075025D77ddEb0151F85e248",
            "0xC582bf07f73a30dd10cc512E03a50C87383eEb91",
            "0x3d84a438Af72F6396785EEa97B32F903520e36C8",
            "0x9192bDC7117A9A0cD989e6363928a26C938fB230",
            "0x012ce20dF50768c8ddcD5Ecc1e9DCBb3cc7bE7fC",
            "0x62CC987e62B3Bef0ED47ff0DFA8864E7F9AeB656",
            "0x9fb101BCd5C7BaEA48E29c45a3F0BD6caAf5709E",
            "0x909102B9a0005B92D0091EdE42C8016F93151Ad2",
            "0x163fe78004b617045474680eC0D8bF4C0d44eE67",
            "0x14B44b350d3ae3147937Cc7689404E00dBc1DDdF",
            "0xcF9ebF877688Ed88a7479A6e63457Fd78D4275cE",
            "0xDdEEe68EA512b7e1Eb62E8B130eA4f67f94d377c",
            "0xDE09E76D5A06523A85bEDADa647AA1A78D99d30C",
            "0x70f2fE4ab62924DB22cC767e32EAB599DbeCbF95",
            "0xf81a7b58Ec5Cec5451E21fE73d5af1131b8F785B",
          ],
        },
      ],
    },
  },
];
