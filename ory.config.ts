const config = {
  project: {
    name: "idpf-test-ory",
    default_locale: "en",
    default_redirect_url: "/profile",
    enabled_locales: ["en"],
    error_ui_url: "/auth/error",
    login_ui_url: "/auth/login",
    registration_ui_url: "/auth/registration",
    recovery_ui_url: "/auth/recovery",
    recovery_enabled: true,
    registration_enabled: true,
    settings_ui_url: "/auth/settings",
    verification_ui_url: "/auth/verification",
    verification_enabled: true,
    locale_behavior: "force_default",
    translations: [],
  },
};

export default config;
