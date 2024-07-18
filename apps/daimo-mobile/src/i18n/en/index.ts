import { BaseTranslation } from "../i18n-types";

const en: BaseTranslation = {
  note: {
    payment: "Payment Link",
    accept: {
      short: "Accept link",
      long: "Accept this link, receiving ",
    },
    cancel: {
      short: "Cancel link",
      long: "Cancel this link, reclaiming ",
    },
    gas_too_high: "Gas too high to claim",
    claimed: "Accepted Link",
    cancelled: "Cancelled Link",
    invalid: "Payment link invalid",
  },
  settings: {
    title: "Settings",
    show_details: "Show details",
    hide_details: "Hide details",
    account: {
      connect_farcaster: "Connect Farcaster",
      view_account_on_explorer: "View account on explorer",
      no_socials_connected: "No socials connected",
    },

    devices: {
      passkeys: {
        title: "What is a Passkey Backup?",
        first_paragraph:
          "Passkeys are a convenient and phishing-resistant alternative to seed phrases.",
        second_paragraph:
          "Passkeys are generated and stored in your password manager, and allow you to recover your account even if you lose your device.",
      },
      create_backup: {
        title: "Create a Backup",
        message: "Passkey, security key, or seed phrase",
        button: "CREATE BACKUP",
      },
      add_device: {
        title: "Add a Device",
        message: "Use your account on another device",
        button: "ADD DEVICE",
      },
      questions: {
        title: "Questions? Feedback?",
        message: "Contact us on Telegram",
        button: "CONTACT SUPPORT",
      },
    },
    log_out: "Log out",
    remove: "Remove",
    pending: "Pending",
    enable_notifications: "Enable notifications",
    send_debug_log: "Send debug log",
  },
};

export default en;
