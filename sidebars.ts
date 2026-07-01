import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type:  "doc",
      id:    "architecture",
      label: "Architecture Overview",
    },
    {
      type:  "doc",
      id:    "system-flow",
      label: "System Flow",
    },
    {
      type:      "category",
      label:     "Smart Contracts",
      collapsed: false,
      items:     ["contracts/tip-splitter"],
    },
    {
      type:      "category",
      label:     "SDK",
      collapsed: false,
      items:     ["sdk/quickstart", "sdk/api-reference"],
    },
    {
      type:      "category",
      label:     "Backend",
      collapsed: false,
      items:     ["backend/api-reference", "backend/indexer"],
    },
    {
      type:      "category",
      label:     "Guides",
      collapsed: false,
      items:     [
        "guides/local-dev",
        "guides/deployment",
        "guides/ci-cd",
      ],
    },
  ],
};

export default sidebars;
