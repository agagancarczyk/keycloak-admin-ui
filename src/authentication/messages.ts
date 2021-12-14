export default {
  authentication: {
    title: "Authentication",
    flows: "Flows",
    requiredActions: "Required actions",
    policies: "Policies",
    passwordPolicy: "Password policy",
    otpPolicy: "OTP Policy",
    webauthnPolicy: "Webauthn Policy",
    webauthnPasswordlessPolicy: "Webauthn Passwordless Policy",
    noPasswordPolicies: "No password policies",
    noPasswordPoliciesInstructions:
      "You haven't added any password policies to this realm. Add a policy to get started.",
    updatePasswordPolicySuccess: "Password policies successfully updated",
    updatePasswordPolicyError:
      "Could not update the password policies: '{{error}}'",
    webAuthnPolicyRpEntityName: "Relying party entity name",
    addPolicy: "Add policy",
    otpType: "OTP type",
    policyType: {
      totp: "Time based",
      hotp: "Counter based",
    },
    otpHashAlgorithm: "OTP hash algorithm",
    otpPolicyDigits: "Number of digits",
    lookAhead: "Look ahead window",
    otpPolicyPeriod: "OTP Token period",
    otpPolicyPeriodErrorHint:
      "Value needs to be between 1 second and 2 minutes",
    initialCounter: "Initial counter",
    initialCounterErrorHint: "Value needs to be between 1 and 120",
    supportedActions: "Supported actions",
    updateOtpSuccess: "OTP policy successfully updated",
    updateOtpError: "Could not update OTP policy: {{error}}",
    flowName: "Flow name",
    searchForFlow: "Search for flow",
    usedBy: "Used by",
    buildIn: "Built-in",
    appliedByProviders: "Applied by the following providers",
    appliedByClients: "Applied by the following clients",
    specificProviders: "Specific providers",
    specificClients: "Specific clients",
    default: "Default",
    notInUse: "Not in use",
    duplicate: "Duplicate",
    setAsDefault: "Set as default",
    editInfo: "Edit info",
    editFlow: "Edit flow",
    edit: "Edit",
    deleteConfirmFlow: "Delete flow?",
    deleteConfirmFlowMessage:
      'Are you sure you want to permanently delete the flow "<1>{{flow}}</1>".',
    deleteFlowSuccess: "Flow successfully deleted",
    deleteFlowError: "Could not delete flow: {{error}}",
    duplicateFlow: "Duplicate flow",
    deleteConfirmExecution: "Delete execution?",
    deleteConfirmExecutionMessage:
      'Are you sure you want to permanently delete the execution "<1>{{name}}</1>".',
    deleteExecutionSuccess: "Execution successfully deleted",
    deleteExecutionError: "Could not delete execution: {{error}}",
    updateFlowSuccess: "Flow successfully updated",
    updateFlowError: "Could not update flow: {{error}}",
    copyOf: "Copy of {{name}}",
    copyFlowSuccess: "Flow successfully duplicated",
    copyFlowError: "Could not duplicate flow: {{error}}",
    createFlow: "Create flow",
    flowType: "Flow type",
    "flow-type": {
      "basic-flow": "Generic",
      "form-flow": "Form",
    },
    "top-level-flow-type": {
      "basic-flow": "Basic flow",
      "client-flow": "Client flow",
    },
    flowCreatedSuccess: "Flow created",
    flowCreateError: "Could not create flow: {{error}}",
    flowDetails: "Flow details",
    tableView: "Table view",
    diagramView: "Diagram view",
    emptyExecution: "No steps",
    emptyExecutionInstructions:
      "You can start defining this flow by adding a sub-flow or an execution",
    addExecutionTitle: "Add an execution",
    addExecution: "Add execution",
    addSubFlowTitle: "Add a sub-flow",
    addSubFlow: "Add sub-flow",
    addCondition: "Add condition",
    addStep: "Add step",
    addStepTo: "Add step to {{name}}",
    steps: "Steps",
    requirement: "Requirement",
    requirements: {
      REQUIRED: "Required",
      ALTERNATIVE: "Alternative",
      DISABLED: "Disabled",
      CONDITIONAL: "Conditional",
    },
    executionConfig: "{{name}} config",
    alias: "Alias",
    configSaveSuccess: "Successfully saved the execution config",
    configSaveError: "Could not save the execution config: {{error}}",
    setAsDefaultAction: "Set as default action",
    disabledOff: "Disabled off",
    updatedRequiredActionSuccess: "Updated required action successfully",
    updatedRequiredActionError: "Could not update required action: {{error}}",
  },
};
