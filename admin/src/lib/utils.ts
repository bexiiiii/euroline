import { twMerge } from "tailwind-merge";

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassDictionary
  | ClassValue[];

interface ClassDictionary {
  [key: string]: boolean | string | number | null | undefined;
}

function toClassArray(input: ClassValue, acc: string[]): void {
  if (!input) {
    return;
  }

  if (typeof input === "string" || typeof input === "number") {
    acc.push(String(input));
    return;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      toClassArray(item, acc);
    }
    return;
  }

  if (typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      if (value) {
        acc.push(key);
      }
    }
  }
}

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    toClassArray(input, classes);
  }
  return twMerge(classes.join(" "));
}
