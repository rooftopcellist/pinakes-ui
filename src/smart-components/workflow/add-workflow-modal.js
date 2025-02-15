import React from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Modal } from '@patternfly/react-core';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';

import { addWorkflow } from '../../redux/actions/workflow-actions';
import routes from '../../constants/approval-routes';
import FormRenderer from '../common/form-renderer';
import addWorkflowSchema from '../../forms/add-workflow.schema';
import formMessages from '../../messages/form.messages';
import { defaultSettings } from '../../helpers/shared/approval-pagination';

// eslint-disable-next-line react/prop-types
const AddWorkflow = ({ postMethod, pagination = defaultSettings }) => {
  const dispatch = useDispatch();
  const { push } = useHistory();
  const intl = useIntl();

  const onSave = ({ group_refs = [], ...values }) => {
    return dispatch(
      addWorkflow(
        {
          ...values,
          group_refs:
            group_refs.length > 0
              ? group_refs.map((group) => ({
                  name: group.label,
                  uuid: group.value
                }))
              : []
        },
        intl
      )
    )
      .then(() => push(routes.workflows.index))
      .then(() => postMethod({ ...pagination }));
  };

  const onCancel = () => push(routes.workflows.index);

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title={intl.formatMessage(formMessages.createApprovalTitle)}
      variant="small"
    >
      <FormRenderer
        onSubmit={onSave}
        onCancel={onCancel}
        schema={addWorkflowSchema(intl)}
        FormTemplate={(props) => (
          <FormTemplate
            {...props}
            buttonClassName="pf-u-mt-0"
            disableSubmit={['validating', 'pristine']}
          />
        )}
      />
    </Modal>
  );
};

export default AddWorkflow;
