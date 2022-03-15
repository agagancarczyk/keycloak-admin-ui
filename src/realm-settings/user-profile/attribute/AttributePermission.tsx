import React, { useState } from "react";
import { Checkbox, FormGroup, Grid, GridItem } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { HelpItem } from "../../../components/help-enabler/HelpItem";
import { UseFormMethods, Controller } from "react-hook-form";
import { FormAccess } from "../../../components/form-access/FormAccess";
import "../../realm-settings-section.css";

export type AttributePermissionProps = {
  form: UseFormMethods;
};

export const AttributePermission = ({ form }: AttributePermissionProps) => {
  const { t } = useTranslation("realm-settings");
  const [isUserEditChecked, setIsUserEditChecked] = useState(true);
  const [isAdminEditChecked, setIsAdminEditChecked] = useState(true);
  const [isUserViewChecked, setIsUserViewChecked] = useState(false);
  const [isAdminViewChecked, setIsAdminViewChecked] = useState(false);

  return (
    <FormAccess role="manage-realm" isHorizontal>
      <FormGroup
        hasNoPaddingTop
        label={t("whoCanEdit")}
        labelIcon={
          <HelpItem
            helpText="realm-settings-help:whoCanEditHelp"
            fieldLabelId="realm-settings:whoCanEdit"
          />
        }
        fieldId="kc-who-can-edit"
      >
        <Grid>
          <GridItem lg={4} sm={6}>
            <Controller
              name="userEdit"
              control={form.control}
              defaultValue={"user"}
              render={({ onChange, value }) => (
                <Checkbox
                  id="user-edit"
                  label={t("user")}
                  data-testid="userEdit"
                  ref={form.register}
                  isChecked={value}
                  onChange={(value) => {
                    onChange(value ? "user" : "");
                    setIsUserEditChecked(value);
                  }}
                />
              )}
            />
          </GridItem>
          <GridItem lg={8} sm={6}>
            <Controller
              name="adminEdit"
              control={form.control}
              defaultValue={"admin"}
              render={({ onChange, value }) => (
                <Checkbox
                  id="admin-edit"
                  label={t("admin")}
                  value="admin"
                  data-testid="adminEdit"
                  ref={form.register}
                  isChecked={value}
                  onChange={(value) => {
                    onChange(value ? "admin" : "");
                    setIsAdminEditChecked(value);
                  }}
                />
              )}
            />
          </GridItem>
        </Grid>
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label={t("whoCanView")}
        labelIcon={
          <HelpItem
            helpText="realm-settings-help:whoCanViewHelp"
            fieldLabelId="realm-settings:whoCanView"
          />
        }
        fieldId="kc-who-can-view"
      >
        <Grid>
          <GridItem lg={4} sm={6}>
            <Controller
              name="userView"
              control={form.control}
              render={({ onChange }) => (
                <Checkbox
                  id="user-view"
                  label={t("user")}
                  value="user"
                  data-testid="userView"
                  ref={form.register}
                  onChange={(value) => {
                    onChange(value ? "user" : "");
                    setIsUserViewChecked(value);
                  }}
                  isChecked={isUserEditChecked ? true : isUserViewChecked}
                  isDisabled={isUserEditChecked}
                />
              )}
            />
          </GridItem>
          <GridItem lg={8} sm={6}>
            <Controller
              name="adminView"
              control={form.control}
              render={({ onChange }) => (
                <Checkbox
                  id="admin-view"
                  label={t("admin")}
                  value="admin"
                  data-testid="adminView"
                  ref={form.register}
                  onChange={(value) => {
                    onChange(value ? "admin" : "");
                    setIsAdminViewChecked(value);
                  }}
                  isChecked={isAdminEditChecked ? true : isAdminViewChecked}
                  isDisabled={isAdminEditChecked}
                />
              )}
            />
          </GridItem>
        </Grid>
      </FormGroup>
    </FormAccess>
  );
};
