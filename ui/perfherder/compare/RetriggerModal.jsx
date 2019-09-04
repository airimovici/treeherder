import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Input,
  Label,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

export default class RetriggerModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: 5,
    };
  }

  updateInput = event => {
    this.setState({ inputValue: event.target.value });
  };

  render() {
    const { showModal, toggle, updateAndClose } = this.props;
    const { inputValue } = this.state;

    return (
      <Modal isOpen={showModal}>
        <ModalHeader toggle={toggle}>Retrigger Jobs</ModalHeader>
        <Form>
          <ModalBody>
            <FormGroup>
              <Label for="retriggerTimes">Number of retriggers:</Label>
              <Input
                value={inputValue || ''}
                onChange={() => {
                  this.updateInput(inputValue);
                }}
                name="retriggerTimes"
                type="input"
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button
              color="secondary"
              onClick={event =>
                updateAndClose(
                  event,
                  {
                    // notes: inputValue.length ? inputValue : null,
                  },
                  'showRetriggerModal',
                )
              }
              type="submit"
            >
              Retrigger
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    );
  }
}

RetriggerModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  updateAndClose: PropTypes.func.isRequired,
};
