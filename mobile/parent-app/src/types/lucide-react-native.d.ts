// Type shim for lucide-react-native.
// The real package is declared in package.json and will supply full types once
// node_modules is populated (npm install). This stub silences the TS2307
// "cannot find module" error in environments where node_modules is empty.

declare module "lucide-react-native" {
  import { FC } from "react";
  import { SvgProps } from "react-native-svg";

  export interface LucideProps extends SvgProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
  }

  type LucideIcon = FC<LucideProps>;

  // Icons used across the parent app screens
  export const AlertCircle: LucideIcon;
  export const Bus: LucideIcon;
  export const Car: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Clock: LucideIcon;
  export const CreditCard: LucideIcon;
  export const LogOut: LucideIcon;
  export const MapPin: LucideIcon;
  export const Navigation: LucideIcon;
  export const Phone: LucideIcon;
  export const Receipt: LucideIcon;
  export const Settings: LucideIcon;
  export const User: LucideIcon;
}
