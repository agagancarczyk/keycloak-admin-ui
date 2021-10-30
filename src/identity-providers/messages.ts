export default {
  "identity-providers": {
    listExplain:
      "Through Identity Brokering it's easy to allow users to authenticate to Keycloak using external Identity Provider or Social Networks.",
    searchForProvider: "Search for provider",
    providerDetails: "Provider details",
    addProvider: "Add provider",
    addMapper: "Add mapper",
    addIdPMapper: "Add {{providerId}} Identity Provider Mapper",
    editIdPMapper: "Edit {{providerId}} Identity Provider Mapper",
    mappersList: "Mappers list",
    noMappers: "No Mappers",
    noMappersInstructions:
      "There are currently no mappers for this identity provider.",
    searchForMapper: "Search for mapper",
    addKeycloakOpenIdProvider: "Add Keycloak OpenID Connect provider",
    addOpenIdProvider: "Add OpenID Connect provider",
    addSamlProvider: "Add SAML provider",
    manageDisplayOrder: "Manage display order",
    deleteProvider: "Delete provider?",
    deleteProviderMapper: "Delete mapper?",
    deleteConfirm:
      "Are you sure you want to permanently delete the provider '{{provider}}'?",
    deleteMapperConfirm:
      "Are you sure you want to permanently delete the mapper {{mapper}}?",
    deleteMapperSuccess: "Mapper successfully deleted.",
    deletedSuccess: "Provider successfully deleted.",
    deleteError: "Could not delete the provider {{error}}",
    disableProvider: "Disable provider?",
    disableConfirm:
      "Are you sure you want to disable the provider '{{provider}}'",
    disableSuccess: "Provider successfully disabled",
    disableError: "Could not disable the provider {{error}}",
    updateSuccess: "Provider successfully updated",
    updateError: "Could not update the provider {{error}}",
    getStarted: "To get started, select a provider from the list below.",
    addIdentityProvider: "Add {{provider}} provider",
    redirectURI: "Redirect URI",
    clientId: "Client ID",
    clientSecret: "Client Secret",
    displayOrder: "Display order",
    createSuccess: "Identity provider successfully created",
    createError: "Could not create the identity provider: {{error}}",
    oderDialogIntro:
      "The order that the providers are listed in the login page or the account console. You can drag the row handles to change the order.",
    manageOrderTableAria:
      "List of identity providers in the order listed on the login page",
    manageOrderItemAria:
      "Press space or enter to begin dragging, and use the arrow keys to navigate up or down. Press enter to confirm the drag, or any other key to cancel the drag operation.",
    orderChangeSuccess:
      "Successfully changed display order of identity providers",
    orderChangeError:
      "Could not change display order of identity providers {{error}}",
    alias: "Alias",
    displayName: "Display name",
    useDiscoveryEndpoint: "Use discovery endpoint",
    discoveryEndpoint: "Discovery endpoint",
    useEntityDescriptor: "Use entity descriptor",
    samlEntityDescriptor: "SAML entity descriptor",
    ssoServiceUrl: "Single Sign-On service URL",
    singleLogoutServiceUrl: "Single logout service URL",
    nameIdPolicyFormat: "NameID policy format",
    persistent: "Persistent",
    transient: "Transient",
    email: "Email",
    kerberos: "Kerberos",
    x509: "X.509 Subject Name",
    windowsDomainQN: "Windows Domain Qualified Name",
    unspecified: "Unspecified",
    principalType: "Principal type",
    principalAttribute: "Principal attribute",
    allowCreate: "Allow create",
    subjectNameId: "Subject NameID",
    attributeName: "Attribute [Name]",
    attributeFriendlyName: "Attribute [Friendly Name]",
    claim: "Claim",
    claimValue: "Claim Value",
    claims: "Claims",
    socialProfileJSONFieldPath: "Social Profile JSON Field Path",
    mapperAttributeName: "Attribute Name",
    mapperUserAttributeName: "User Attribute Name",
    mapperAttributeFriendlyName: "Friendly name",
    httpPostBindingResponse: "HTTP-POST binding response",
    httpPostBindingAuthnRequest: "HTTP-POST binding for AuthnRequest",
    httpPostBindingLogout: "HTTP-POST binding logout",
    wantAuthnRequestsSigned: "Want AuthnRequests signed",
    signatureAlgorithm: "Signature algorithm",
    samlSignatureKeyName: "SAML signature key name",
    wantAssertionsSigned: "Want Assertions signed",
    wantAssertionsEncrypted: "Want Assertions encrypted",
    forceAuthentication: "Force authentication",
    validatingX509Certs: "Validating X509 certificates",
    signServiceProviderMetadata: "Sign service provider metadata",
    passSubject: "Pass subject",
    serviceProviderEntityId: "Service provider entity ID",
    importConfig: "Import config from file",
    showMetaData: "Show metadata",
    hideMetaData: "Hide metadata",
    noValidMetaDataFound: "No valid metadata was found at this URL",
    advanced: "Advanced",
    metadataOfDiscoveryEndpoint: "Metadata of the discovery endpoint",
    authorizationUrl: "Authorization URL",
    passLoginHint: "Pass login_hint",
    passCurrentLocale: "Pass current locale",
    tokenUrl: "Token URL",
    logoutUrl: "Logout URL",
    backchannelLogout: "Backchannel logout",
    disableUserInfo: "Disable user info",
    userInfoUrl: "User Info URL",
    issuer: "Issuer",
    scopes: "Scopes",
    prompt: "Prompt",
    prompts: {
      unspecified: "Unspecified",
      none: "None",
      consent: "Consent",
      login: "Login",
      select_account: "Select account",
    },
    clientAuthentication: "Client authentication",
    clientAuthentications: {
      clientAuth_post: "Client secret sent as post",
      clientAuth_basic: "Client secret sent as basic auth",
      clientAuth_secret_jwt: "Client secret as jwt",
      clientAuth_privatekey_jwt: "JWT signed with private key",
    },
    acceptsPromptNone: "Accepts prompt=none forward from client",
    validateSignature: "Validate Signatures",
    useJwksUrl: "Use JWKS URL",
    jwksUrl: "JWKS URL",
    allowedClockSkew: "Allowed clock skew",
    forwardParameters: "Forwarded query parameters",
    generalSettings: "General settings",
    oidcSettings: "OpenID Connect settings",
    samlSettings: "SAML settings",
    advancedSettings: "Advanced settings",
    reqAuthnConstraints: "Requested AuthnContext Constraints",
    keyID: "KEY_ID",
    NONE: "NONE",
    certSubject: "CERT_SUBJECT",
    storeTokens: "Store tokens",
    storedTokensReadable: "Stored tokens readable",
    comparison: "Comparison",
    authnContextClassRefs: "AuthnContext ClassRefs",
    authnContextDeclRefs: "AuthnContext DeclRefs",
    trustEmail: "Trust Email",
    accountLinkingOnly: "Account linking only",
    hideOnLoginPage: "Hide on login page",
    firstBrokerLoginFlowAlias: "First login flow",
    postBrokerLoginFlowAlias: "Post login flow",
    syncMode: "Sync mode",
    syncModes: {
      inherit: "Inherit",
      import: "Import",
      legacy: "Legacy",
      force: "Force",
    },
    mapperTypes: {
      advancedAttributeToRole: "Advanced Attribute To Role",
      advancedClaimToRole: "Advanced Claim To Role",
      externalRoleToRole: "External Role To Role",
      claimToRole: "Claim To Role",
      usernameTemplateImporter: "Username Template Importer",
      hardcodedUserSessionAttribute: "Hardcoded User Session Attribute",
      attributeImporter: "Attribute Importer",
      hardcodedRole: "Hardcoded Role",
      hardcodedAttribute: "Hardcoded Attribute",
      samlAttributeToRole: "SAML Attribute To Role",
    },
    syncModeOverride: "Sync mode override",
    mapperType: "Mapper type",
    regexAttributeValues: "Regex Attribute Values",
    regexClaimValues: "Regex Claim Values",
    selectRole: "Select role",
    mapperCreateSuccess: "Mapper created successfully.",
    mapperCreateError: "Error creating mapper.",
    mapperSaveSuccess: "Mapper saved successfully.",
    mapperSaveError: "Error saving mapper: {{error}}",
    userAttribute: "User Attribute",
    attributeValue: "Attribute Value",
    userAttributeValue: "User Attribute Value",
    userSessionAttribute: "User Session Attribute",
    userSessionAttributeValue: "User Session Attribute Value",
    template: "Template",
    target: "Target",
    targetOptions: {
      local: "LOCAL",
      brokerId: "BROKER_ID",
      brokerUsername: "BROKER_USERNAME",
    },
  },
};
