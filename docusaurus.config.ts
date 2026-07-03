import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title:   "Novatip Docs",
  tagline: "Tap-to-tip any creator, cross-border, in 2 seconds.",
  favicon: "img/favicon.ico",

  url:            "https://docs.novatip.xyz",
  baseUrl:        "/",
  organizationName: "novatip",
  projectName:      "novatip-docs",
  trailingSlash:    false,

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales:       ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath:    "./sidebars.ts",
          routeBasePath:  "/",
          editUrl: "https://github.com/novatip/novatip-docs/edit/main/",
          showLastUpdateTime:   true,
          showLastUpdateAuthor: true,
        },
        blog:  false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/novatip-social.png",

    colorMode: {
      defaultMode:          "dark",
      disableSwitch:        false,
      respectPrefersColorScheme: true,
    },

    navbar: {
      title: "Novatip",
      logo: {
        alt: "Novatip logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type:      "docSidebar",
          sidebarId: "mainSidebar",
          position:  "left",
          label:     "Docs",
        },
        {
          href:     "https://github.com/novatip",
          label:    "GitHub",
          position: "right",
        },
        {
          href:     "https://novatip.xyz",
          label:    "App",
          position: "right",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Architecture",    to: "/architecture" },
            { label: "Contract",        to: "/contracts/tip-splitter" },
            { label: "SDK",             to: "/sdk/quickstart" },
            { label: "Backend API",     to: "/backend/api-reference" },
            { label: "Local Dev Setup", to: "/guides/local-dev" },
          ],
        },
        {
          title: "Community",
          items: [
            { label: "GitHub",   href: "https://github.com/novatip" },
            { label: "Twitter",  href: "https://twitter.com/novatipxyz" },
          ],
        },
        {
          title: "More",
          items: [
            { label: "Novatip App",       href: "https://novatip.xyz" },
            { label: "Stellar Network",   href: "https://stellar.org" },
            { label: "Soroban",           href: "https://soroban.stellar.org" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Novatip. Built with Docusaurus.`,
    },

    prism: {
      theme:           prismThemes.github,
      darkTheme:       prismThemes.dracula,
      additionalLanguages: ["rust", "bash", "json", "toml", "yaml", "typescript"],
    },

  } satisfies Preset.ThemeConfig,
};

export default config;
