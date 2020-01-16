import React from 'react';
import PropTypes from 'prop-types';

import FilterControls from '../FilterControls';
import { convertParams } from '../helpers';

import AlertTable from './AlertTable';

export default class AlertsViewControls extends React.Component {
  constructor(props) {
    super(props);
    this.validated = this.props.validated;
    this.state = {
      hideImprovements: convertParams(this.validated, 'hideImprovements'),
      hideDownstream: convertParams(this.validated, 'hideDwnToInv'),
      hideAssignedToOthers: convertParams(
        this.validated,
        'hideAssignedToOthers',
      ),
    };
  }

  componentDidUpdate(prevProps) {
    const { validated } = this.props;

    if (
      validated.hideImprovements !== prevProps.validated.hideImprovements ||
      validated.hideDwnToInv !== prevProps.validated.hideDwnToInv
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        hideImprovements: convertParams(
          this.props.validated,
          'hideImprovements',
        ),
        hideDownstream: convertParams(this.props.validated, 'hideDwnToInv'),
      });
    }
  }

  updateFilter = filter => {
    this.setState(
      prevState => ({ [filter]: !prevState[filter] }),
      () =>
        this.props.validated.updateParams({
          [filter === 'hideDownstream' ? 'hideDwnToInv' : filter]: +this.state[
            filter
          ],
        }),
    );
  };

  getClientSideFilters = () => {
    const { filterText } = this.props;
    const {
      hideImprovements,
      hideDownstream,
      hideAssignedToOthers,
    } = this.state;

    return {
      filterText,
      hideImprovements,
      hideDownstream,
      hideAssignedToOthers,
    };
  };

  render() {
    const {
      alertSummaries,
      dropdownOptions,
      updateFilterText,
      fetchAlertSummaries,
      user,
    } = this.props;
    const clientSideFilters = this.getClientSideFilters();
    const {
      hideImprovements,
      hideDownstream,
      hideAssignedToOthers,
    } = clientSideFilters;

    const alertCheckboxes = [
      {
        text: 'Hide improvements',
        state: hideImprovements,
        stateName: 'hideImprovements',
      },
      {
        text: 'Hide downstream / reassigned to / invalid',
        state: hideDownstream,
        stateName: 'hideDownstream',
      },
    ];

    if (user.isLoggedIn) {
      alertCheckboxes.push({
        text: 'My alerts',
        state: hideAssignedToOthers,
        stateName: 'hideAssignedToOthers',
      });
    }

    return (
      <React.Fragment>
        <FilterControls
          dropdownOptions={dropdownOptions}
          filterOptions={alertCheckboxes}
          updateFilter={this.updateFilter}
          updateFilterText={updateFilterText}
          dropdownCol
        />
        {alertSummaries.length > 0 &&
          alertSummaries.map(alertSummary => (
            <AlertTable
              filters={clientSideFilters}
              key={alertSummary.id}
              alertSummary={alertSummary}
              fetchAlertSummaries={fetchAlertSummaries}
              user={user}
              {...this.props}
            />
          ))}
      </React.Fragment>
    );
  }
}

AlertsViewControls.propTypes = {
  validated: PropTypes.shape({
    updateParams: PropTypes.func,
  }).isRequired,
  dropdownOptions: PropTypes.arrayOf(PropTypes.shape({})),
  filterText: PropTypes.string.isRequired,
  updateFilterText: PropTypes.func.isRequired,
  fetchAlertSummaries: PropTypes.func.isRequired,
  alertSummaries: PropTypes.arrayOf(PropTypes.shape({})),
  user: PropTypes.shape({}).isRequired,
};

AlertsViewControls.defaultProps = {
  dropdownOptions: null,
  alertSummaries: [],
};
