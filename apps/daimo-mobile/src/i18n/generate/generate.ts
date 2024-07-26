import fs from "fs";
import path from "path";

import { en } from "../languages/en";

// TODO: add this to package.json generation
function generateLanguageType(json: any, parentKey: string = ""): string {
  let type = "";

  for (const [key, value] of Object.entries(json)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === "function") {
      const funcStr = value.toString();
      const params = funcStr.match(/\((.*?)\)/)?.[1] || "";
      if (params) {
        // Handle simple parameters
        const paramTypes = params
          .split(",")
          .map((param) => {
            const [name, type] = param.trim().split(":");
            return `${name.trim()}${type ? `: ${type.trim()}` : ": any"}`;
          })
          .join(", ");
        type += `  "${key}": (${paramTypes}) => string;\n`;
      } else {
        type += `  "${key}": () => string;\n`;
      }
    } else if (typeof value === "object" && value !== null) {
      type += `  "${key}": {\n`;
      type += generateLanguageType(value, fullKey);
      type += `  };\n`;
    }
  }

  return type;
}

function writeLanguageDefinitionToFile() {
  const languageType = `export interface LanguageDefinition {\n${generateLanguageType(
    en
  )}}\n`;

  const filePath = path.join(__dirname, "languageDefinition.ts");

  fs.writeFileSync(filePath, languageType, "utf8");

  console.log(`Language definition has been written to ${filePath}`);
}

// Run the function
writeLanguageDefinitionToFile();
