import { NAN } from "@/internal/types";
import type { Dec } from "@/internal/types";

export function negateDec(d: Dec): Dec {
  switch (d.kind) {
    case "nan":
      return d;
    case "inf":
      return { kind: "inf", sign: d.sign === 1 ? -1 : 1 };
    case "zero":
      return { kind: "zero", sign: d.sign === 1 ? -1 : 1 };
    case "finite":
      return { ...d, sign: d.sign === 1 ? -1 : 1 };
  }
}

export { NAN };
