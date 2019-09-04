import React from 'react';
import { Button, Table } from 'reactstrap';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faRedo,
  faThumbsUp,
} from '@fortawesome/free-solid-svg-icons';

import JobModel from '../../models/job';
import SimpleTooltip from '../../shared/SimpleTooltip';
import { displayNumber } from '../helpers';
import { compareTableText } from '../constants';
import ProgressBar from '../ProgressBar';

import RetriggerModal from './RetriggerModal';
import TableAverage from './TableAverage';

export default class CompareTable extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showRetriggerModal: false,
    };
  }

  getColorClass = (data, type) => {
    const { className, isRegression, isImprovement } = data;
    if (type === 'bar' && !isRegression && !isImprovement) return 'secondary';
    if (type === 'background' && className === 'warning')
      return `bg-${className}`;
    if (type === 'text' && className) return `text-${className}`;
    return className;
  };

  deltaTooltipText = (delta, percentage, improvement) =>
    `Mean difference: ${displayNumber(delta)} (= ${Math.abs(
      displayNumber(percentage),
    )}% ${improvement ? 'better' : 'worse'})`;

  retriggerJobs = async (results, times) => {
    // retrigger base revision jobs
    this.retriggerByRevision(
      results.originalJobIds,
      results.originalRepoName,
      true,
      times,
    );
    // retrigger new revision jobs
    this.retriggerByRevision(
      results.newJobIds,
      results.newRepoName,
      false,
      times,
    );
  };

  retriggerByRevision = async (jobIds, repoName, isBaseline, times) => {
    const { isBaseAggregate, notify, retriggerJob, getJob } = this.props;

    // do not retrigger if the base is aggregate (there is a selected time range)
    if (isBaseline && isBaseAggregate) {
      return;
    }

    if (jobIds.length) {
      // retrigger only the first job for the revision
      const job = await getJob(repoName, jobIds[0]);
      retriggerJob([job], repoName, notify, times);
    }
  };

  toggle = state => {
    this.setState(prevState => ({
      [state]: !prevState[state],
    }));
  };

  updateAndClose = async (event, params, state) => {
    event.preventDefault();
    this.toggle(state);
  };

  render() {
    const { data, testName, user, hasSubtests } = this.props;
    const { showRetriggerModal } = this.state;
    return (
      <React.Fragment>
        <RetriggerModal
          showModal={showRetriggerModal}
          toggle={() => this.toggle('showRetriggerModal')}
          updateAndClose={this.updateAndClose}
        />
        <Table sz="small" className="compare-table mb-0 px-0" key={testName}>
          <thead>
            <tr className="subtest-header bg-lightgray">
              <th className="text-left">
                <span>{testName}</span>
              </th>
              <th className="table-width-lg">Base</th>
              {/* empty for less than/greater than data */}
              <th className="table-width-sm" />
              <th className="table-width-lg">New</th>
              <th className="table-width-lg">Delta</th>
              {/* empty for progress bars (magnitude of difference) */}
              <th className="table-width-lg" />
              <th className="table-width-lg">Confidence</th>
              <th className="text-right table-width-md">
                {hasSubtests && data && user.isLoggedIn && (
                  <Button
                    className="retrigger-btn btn icon-green mr-1 py-0 px-1"
                    title={compareTableText.retriggerButtonTitle}
                    onClick={() => this.retriggerJobs(data[0], 5)}
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </Button>
                )}
                # Runs
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map(results => (
              <tr key={results.name}>
                <th className="text-left font-weight-normal pl-1">
                  {results.name}
                  {results.links && (
                    <span className="result-links">
                      {results.links.map(link => (
                        <span key={link.title}>
                          <a href={link.href}>{` ${link.title}`}</a>
                        </span>
                      ))}
                    </span>
                  )}
                </th>
                <TableAverage
                  value={results.originalValue}
                  stddev={results.originalStddev}
                  stddevpct={results.originalStddevPct}
                  replicates={results.originalRuns}
                />
                <td>
                  {results.originalValue < results.newValue && (
                    <span>&lt;</span>
                  )}
                  {results.originalValue > results.newValue && (
                    <span>&gt;</span>
                  )}
                </td>
                <TableAverage
                  value={results.newValue}
                  stddev={results.newStddev}
                  stddevpct={results.newStddevPct}
                  replicates={results.newRuns}
                />
                <td className={this.getColorClass(results, 'background')}>
                  {results.delta &&
                  Math.abs(displayNumber(results.deltaPercentage)) !== 0 ? (
                    <SimpleTooltip
                      textClass="detail-hint"
                      text={
                        <React.Fragment>
                          {(results.isRegression || results.isImprovement) && (
                            <FontAwesomeIcon
                              icon={
                                results.isRegression
                                  ? faExclamationTriangle
                                  : faThumbsUp
                              }
                              title={
                                results.isRegression
                                  ? 'regression'
                                  : 'improvement'
                              }
                              className={this.getColorClass(results, 'text')}
                              size="lg"
                            />
                          )}
                          {`  ${displayNumber(results.deltaPercentage)}%`}
                        </React.Fragment>
                      }
                      tooltipText={this.deltaTooltipText(
                        results.delta,
                        results.deltaPercentage,
                        results.newIsBetter,
                      )}
                    />
                  ) : null}
                  {results.delta
                    ? Math.abs(displayNumber(results.deltaPercentage)) ===
                        0 && (
                        <span>{displayNumber(results.deltaPercentage)}%</span>
                      )
                    : null}
                </td>
                <td>
                  {results.delta ? (
                    <ProgressBar
                      magnitude={results.magnitude}
                      regression={!results.newIsBetter}
                      color={this.getColorClass(results, 'bar')}
                    />
                  ) : null}
                </td>
                <td>
                  {results.delta &&
                  results.confidence &&
                  results.confidenceText ? (
                    <SimpleTooltip
                      textClass="detail-hint"
                      text={`${displayNumber(results.confidence)} (${
                        results.confidenceText
                      })`}
                      tooltipText={results.confidenceTextLong}
                    />
                  ) : null}
                </td>
                <td className="text-right">
                  {!hasSubtests && user.isLoggedIn && (
                    <Button
                      className="retrigger-btn btn icon-green mr-1 py-0 px-1"
                      title={compareTableText.retriggerButtonTitle}
                      onClick={() => this.toggle('showRetriggerModal')} // () => this.retriggerJobs(results, 5)}
                    >
                      <FontAwesomeIcon icon={faRedo} />
                    </Button>
                  )}
                  {results.originalRuns && (
                    <SimpleTooltip
                      textClass="detail-hint"
                      text={`${results.originalRuns.length} / ${results.newRuns.length}`}
                      tooltipText={`${results.originalRuns.length} base / ${results.newRuns.length} new`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </React.Fragment>
    );
  }
}

CompareTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})),
  testName: PropTypes.string.isRequired,
  user: PropTypes.shape({}).isRequired,
  isBaseAggregate: PropTypes.bool.isRequired,
  hasSubtests: PropTypes.bool,
  retriggerJob: PropTypes.func,
  getJob: PropTypes.func,
};

CompareTable.defaultProps = {
  data: null,
  hasSubtests: false,
  retriggerJob: JobModel.retrigger,
  getJob: JobModel.get,
};
