import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, UseFormMethods } from "react-hook-form";
import {
  ActionGroup,
  Button,
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
} from "@patternfly/react-core";

import { HelpItem } from "../../components/help-enabler/HelpItem";
import { useServerInfo } from "../../context/server-info/ServerInfoProvider";

type EventListenersFormProps = {
  form: UseFormMethods;
  reset: () => void;
};

export const EventListenersForm = ({
  form,
  reset,
}: EventListenersFormProps) => {
  const { t } = useTranslation("realm-settings");
  const {
    control,
    formState: { isDirty },
  } = form;

  const [selectOperationTypesOpen, setSelectOperationTypesOpen] =
    useState(false);
  const serverInfo = useServerInfo();
  const eventListeners = serverInfo.providers?.eventsListener.providers;

  return (
    <>
      <FormGroup
        hasNoPaddingTop
        label={t("eventListeners")}
        fieldId={"kc-eventListeners"}
        labelIcon={
          <HelpItem
            helpText={t("eventListenersHelpText")}
            forLabel={t("eventListeners")}
            forID={t(`common:helpLabel`, { label: t("saveEventListeners") })}
          />
        }
      >
        <Controller
          name="eventsListeners"
          defaultValue=""
          control={control}
          render={({
            onChange,
            value,
          }: {
            onChange: (newValue: string[]) => void;
            value: string[];
          }) => (
            <Select
              name="eventsListeners"
              className="kc_eventListeners_select"
              data-testid="eventListeners-select"
              chipGroupProps={{
                numChips: 3,
                expandedText: t("common:hide"),
                collapsedText: t("common:showRemaining"),
              }}
              variant={SelectVariant.typeaheadMulti}
              typeAheadAriaLabel="Select"
              onToggle={(isOpen) => setSelectOperationTypesOpen(isOpen)}
              selections={value}
              onSelect={(_, selectedValue) => {
                const option = selectedValue.toString();
                const changedValue = value.includes(option)
                  ? value.filter((item) => item !== option)
                  : [...value, option];

                onChange(changedValue);
              }}
              onClear={(operation) => {
                operation.stopPropagation();
                onChange([]);
              }}
              isOpen={selectOperationTypesOpen}
              aria-labelledby={"eventsListeners"}
            >
              {Object.keys(eventListeners!).map((event) => (
                <SelectOption key={event} value={event} />
              ))}
            </Select>
          )}
        />
      </FormGroup>
      <ActionGroup>
        <Button
          variant="primary"
          type="submit"
          id={`save`}
          data-testid={`save`}
          isDisabled={!isDirty}
        >
          {t("common:save")}
        </Button>
        <Button variant="link" onClick={reset}>
          {t("common:revert")}
        </Button>
      </ActionGroup>
    </>
  );
};
