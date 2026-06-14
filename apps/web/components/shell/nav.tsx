import type { ComponentType } from "react";
import {
  AnalyticsIcon,
  BrainIcon,
  EditorIcon,
  HomeIcon,
  PullRequestIcon,
  SettingsIcon,
} from "../icons";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/home", Icon: HomeIcon },
  { id: "pr-review", label: "PR Review", href: "/pr", Icon: PullRequestIcon },
  { id: "brain", label: "Brain", href: "/brain", Icon: BrainIcon },
  { id: "editor", label: "Editor", href: "/editor", Icon: EditorIcon },
  { id: "analytics", label: "Analytics", href: "/analytics", Icon: AnalyticsIcon },
  { id: "settings", label: "Settings", href: "/settings", Icon: SettingsIcon },
];
