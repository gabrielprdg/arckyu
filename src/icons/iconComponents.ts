import {
  AppWindow, Boxes, Building2, Cloud, Cpu, Database, Globe, HardDrive, Inbox, Landmark, Network, Server,
  Shield, Smartphone, User, Workflow, type LucideIcon,
} from "lucide-react";
import type { IconCategory } from "../model/types";

const BY_REF: Record<string, LucideIcon> = {
  "generic:user": User,
  "generic:browser": AppWindow,
  "generic:mobile": Smartphone,
  "generic:dns": Globe,
  "generic:cdn": Cloud,
  "generic:firewall": Shield,
  "generic:server": Server,
  "generic:worker": Cpu,
  "generic:storage": HardDrive,
  "generic:external-system": Building2,
  "generic:registry": Landmark,
};

// Glifo padrão por categoria: usado no item próprio sem ícone e quando o logo não carrega.
const BY_CATEGORY: Record<string, LucideIcon> = {
  client: User, network: Network, compute: Cpu, database: Database,
  messaging: Inbox, storage: HardDrive, security: Shield, container: Boxes,
};

export const getIconComponent = (ref: string, category: IconCategory): LucideIcon =>
  BY_REF[ref] ?? BY_CATEGORY[category] ?? Workflow;
