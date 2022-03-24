/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonVariant,
  Divider,
  Flex,
  FlexItem,
  Text,
  TextVariants,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import "../../realm-settings-section.css";
import { PlusCircleIcon } from "@patternfly/react-icons";
import { AddValidatorDialog } from "../attribute/AddValidatorDialog";
import {
  TableComposable,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import { useConfirmDialog } from "../../../components/confirm-dialog/ConfirmDialog";
import type { Validator } from "./Validators";
import useToggle from "../../../utils/useToggle";
import { useFormContext, useWatch } from "react-hook-form";

import "../../realm-settings-section.css";
import type { AttributeParams } from "../../routes/Attribute";
import { useParams } from "react-router-dom";
import { useUserProfile } from "../UserProfileContext";

export const AttributeValidations = () => {
  const { t } = useTranslation("realm-settings");
  const [addValidatorModalOpen, toggleModal] = useToggle();
  const [validatorToDelete, setValidatorToDelete] =
    useState<{ name: string }>();
  const { getValues, setValue, control, register } = useFormContext();
  const { attributeName } = useParams<AttributeParams>();
  const { config } = useUserProfile();
  const attributes = config?.attributes;
  const attribute = attributes?.find(
    (attribute) => attribute.name === attributeName
  );
  const editMode = attributeName ? true : false;
  const validators = useWatch<Validator[]>({
    name: "validations",
    control,
    defaultValue: [],
  });

  const attributeValidators = Object.entries(attribute?.validations ?? []).map(
    ([key, value]) => ({
      name: key,
      config: value,
    })
  );

  let updatedEditValidatorsValues: Validator[] = [];
  const updatedEditValidators = getValues();

  if (updatedEditValidators.validations) {
    updatedEditValidatorsValues = Object.assign(
      updatedEditValidatorsValues,
      updatedEditValidators.validations
    );
  } else {
    updatedEditValidatorsValues = Object.assign(
      updatedEditValidatorsValues,
      attributeValidators
    );
  }

  useEffect(() => register("validations"), []);

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: t("deleteValidatorConfirmTitle"),
    messageKey: t("deleteValidatorConfirmMsg", {
      validatorName: validatorToDelete?.name!,
    }),
    continueButtonLabel: "common:delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      const updatedValidators = validators.filter(
        (validator) => validator.name !== validatorToDelete?.name
      );

      const updatedEditValidators = updatedEditValidatorsValues.filter(
        (validator) => validator.name !== validatorToDelete?.name
      );
      setValue(
        "validations",
        editMode ? [...updatedEditValidators] : [...updatedValidators]
      );
    },
  });

  return (
    <>
      {addValidatorModalOpen && (
        <AddValidatorDialog
          onConfirm={(newValidator) => {
            setValue("validations", [...validators, newValidator]);
          }}
          toggleDialog={toggleModal}
        />
      )}
      <DeleteConfirm />
      <div className="kc-attributes-validations">
        <Flex>
          <FlexItem align={{ default: "alignRight" }}>
            <Button
              id="addValidator"
              onClick={() => toggleModal()}
              variant="link"
              className="kc-addValidator"
              data-testid="addValidator"
              icon={<PlusCircleIcon />}
            >
              {t("realm-settings:addValidator")}
            </Button>
          </FlexItem>
        </Flex>
        <Divider />
        <TableComposable aria-label="validators-table">
          <Thead>
            <Tr>
              <Th>{t("validatorColNames.colName")}</Th>
              <Th>{t("validatorColNames.colConfig")}</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {!editMode && validators.length
              ? validators.map((validator: Validator) => (
                  <Tr key={validator.name}>
                    <Td dataLabel={t("validatorColNames.colName")}>
                      {validator.name}
                    </Td>
                    <Td dataLabel={t("validatorColNames.colConfig")}>
                      {JSON.stringify(validator.config)}
                    </Td>
                    <Td>
                      <Button
                        key="validator"
                        variant="link"
                        data-testid="deleteValidator"
                        onClick={() => {
                          toggleDeleteDialog();
                          setValidatorToDelete({
                            name: validator.name,
                          });
                        }}
                      >
                        {t("common:delete")}
                      </Button>
                    </Td>
                  </Tr>
                ))
              : updatedEditValidatorsValues.map((validator) => (
                  <Tr key={validator.name}>
                    <Td dataLabel={t("validatorColNames.colName")}>
                      {validator.name}
                    </Td>
                    <Td dataLabel={t("validatorColNames.colConfig")}>
                      {JSON.stringify(validator.config)}
                    </Td>
                    <Td>
                      <Button
                        key="validator"
                        variant="link"
                        data-testid="deleteValidator"
                        onClick={() => {
                          toggleDeleteDialog();
                          setValidatorToDelete({
                            name: validator.name,
                          });
                        }}
                      >
                        {t("common:delete")}
                      </Button>
                    </Td>
                  </Tr>
                ))}
            {validators.length === 0 &&
              updatedEditValidatorsValues.length === 0 && (
                <Text
                  className="kc-emptyValidators"
                  component={TextVariants.h6}
                >
                  {t("realm-settings:emptyValidators")}
                </Text>
              )}
          </Tbody>
        </TableComposable>
      </div>
    </>
  );
};
