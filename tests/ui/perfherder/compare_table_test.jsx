import React from 'react';
import {
  render,
  cleanup,
  fireEvent,
  waitForElement,
  waitForElementToBeRemoved,
} from '@testing-library/react';

import CompareTableControls from '../../../ui/perfherder/compare/CompareTableControls';
import { compareTableText, filterText } from '../../../ui/perfherder/constants';
import CompareTable from '../../../ui/perfherder/compare/CompareTable';

// TODO addtional tests:
// 1) that the table is receiving the correct data structure after data
// is transformed in compare and comparesubtests views (Map containing objects with arrays as props)
// 2) if filterByFramework is true, frameworks returns a list
// 3) if a new framework is selected, results are updated

// TODO replace with mock data performance/summary API that is transformed
// by getResultsMap in compareView and comparesubtests view
const result = [
  {
    className: 'danger',
    confidence: 5.057234137528269,
    confidenceText: 'high',
    confidenceTextLong:
      "Result of running t-test on base versus new result distribution: A value of 'high' indicates more confidence that there is a significant change, however you should check the historical record for the test by looking at the graph to be more sure (some noisy tests can provide inconsistent results).",
    delta: 3.9191666666666265,
    deltaPercentage: 2.23249676019764,
    frameworkId: 1,
    isComplete: 1,
    isConfident: false,
    isEmpty: false,
    isImprovement: false,
    isMeaningful: true,
    isNoiseMetric: true,
    isRegression: true,
    links: [],
    magnitude: 11.162483800988202,
    name: 'linux64',
    needsMoreRuns: false,
    newIsBetter: false,
    newRuns: [],
    originalJobIds: [111, 112],
    originalRepoName: 'try',
    newJobIds: [121, 122],
    newRepoName: 'mozilla-central',
  },
  {
    className: 'danger',
    confidence: 5.057234137528269,
    confidenceText: 'high',
    confidenceTextLong:
      "Result of running t-test on base versus new result distribution: A value of 'high' indicates more confidence that there is a significant change, however you should check the historical record for the test by looking at the graph to be more sure (some noisy tests can provide inconsistent results).",
    delta: 3.9191666666666265,
    deltaPercentage: 2.23249676019764,
    frameworkId: 1,
    isComplete: 1,
    isConfident: true,
    isEmpty: false,
    isImprovement: false,
    isMeaningful: true,
    isNoiseMetric: false,
    isRegression: true,
    links: [],
    magnitude: 11.162483800988202,
    name: 'osx-10-10',
    needsMoreRuns: false,
    newIsBetter: false,
    newRuns: [],
    originalJobIds: [],
    originalRepoName: 'mozilla-central',
    newJobIds: [],
    newRepoName: 'mozilla-central',
  },
];

const results = new Map([['a11yr pgo e10s stylo', result]]);
const getMockRetrigger = data => {
  return (jobs, repoName, notify, times) => {
    if (!('retriggers' in data)) {
      data.retriggers = [];
    }
    data.retriggers.push({ jobs, repoName, notify, times });
  };
};

afterEach(cleanup);

const compareTableControls = (userLoggedIn = false) =>
  render(
    <CompareTableControls
      compareResults={results}
      filterOptions={{}}
      user={{ isLoggedIn: userLoggedIn }}
      notify={() => {}}
      isBaseAggregate={false}
    />,
  );

const compareTable = (
  userLoggedIn,
  isBaseAggregate = false,
  mockDataRetrigger = { retriggers: [] },
) =>
  render(
    <CompareTable
      user={{ isLoggedIn: userLoggedIn }}
      data={result}
      testName="Test Name"
      notify={() => {}}
      isBaseAggregate={isBaseAggregate}
      retriggerJob={getMockRetrigger(mockDataRetrigger)}
      getJob={(repoName, jobId) => {
        return { id: jobId };
      }}
    />,
  );

test('toggle buttons should filter results by selected filter', async () => {
  const { getByText } = compareTableControls();

  const result1 = await waitForElement(() => getByText(result[0].name));
  const result2 = await waitForElement(() => getByText(result[1].name));

  // default - no filters selected
  expect(result1).toBeInTheDocument();
  expect(result2).toBeInTheDocument();

  // one filter selected
  const showImportant = getByText(filterText.showImportant);
  fireEvent.click(showImportant);

  // active prop is treated as as a classname rather than an attribute
  // (toHaveAttribute), such as disabled
  expect(showImportant).toHaveClass('active');
  expect(result1).toBeInTheDocument();
  expect(result2).toBeInTheDocument();

  // two filters selected
  const hideUncertain = getByText(filterText.hideUncertain);
  fireEvent.click(hideUncertain);

  expect(hideUncertain).toHaveClass('active');
  expect(result1).not.toBeInTheDocument();
  expect(result2).toBeInTheDocument();
});

test('text input filter results should differ when filter button(s) are selected', async () => {
  const {
    getByText,
    getByPlaceholderText,
    queryByText,
  } = compareTableControls();

  const result1 = await waitForElement(() => getByText(result[0].name));
  const result2 = await waitForElement(() => getByText(result[1].name));

  const filterInput = await waitForElement(() =>
    getByPlaceholderText(filterText.inputPlaceholder),
  );

  fireEvent.change(filterInput, { target: { value: 'linux' } });

  expect(filterInput.value).toBe('linux');
  await waitForElementToBeRemoved(() => queryByText(result[1].name));
  expect(result1).toBeInTheDocument();

  const hideUncertain = getByText(filterText.hideUncertain);
  fireEvent.click(hideUncertain);

  expect(hideUncertain).toHaveClass('active');
  expect(result1).not.toBeInTheDocument();
  expect(result2).not.toBeInTheDocument();
});

test('retrigger buttons should be present if user is logged in', async () => {
  const { queryAllByTitle } = compareTableControls(true);
  const retriggerButtons = queryAllByTitle(
    compareTableText.retriggerButtonTitle,
  );
  expect(retriggerButtons).toHaveLength(2);
});

test('retrigger buttons should not exist if user is not logged in', async () => {
  const { queryAllByTitle } = compareTableControls(false);
  const retriggerButtons = queryAllByTitle(
    compareTableText.retriggerButtonTitle,
  );
  expect(retriggerButtons).toHaveLength(0);
});

test('retrigger should trigger jobs for base and new repositories', async () => {
  const mockDataRetrigger = { retriggers: [] };
  const { queryAllByTitle } = compareTable(true, false, mockDataRetrigger);
  const retriggerButtons = queryAllByTitle(
    compareTableText.retriggerButtonTitle,
  );

  expect(retriggerButtons).toHaveLength(2);
  await fireEvent.click(retriggerButtons[0]);

  expect(mockDataRetrigger.retriggers).toHaveLength(2);
  expect(mockDataRetrigger.retriggers[0].jobs).toHaveLength(1);
  expect(mockDataRetrigger.retriggers[0].jobs[0].id).toEqual(
    result[0].originalJobIds[0],
  );
  expect(mockDataRetrigger.retriggers[1].jobs).toHaveLength(1);
  expect(mockDataRetrigger.retriggers[1].jobs[0].id).toEqual(
    result[0].newJobIds[0],
  );
});

test('retrigger should only work on new repo when base is aggregate', async () => {
  const mockDataRetrigger = { retriggers: [] };
  const { queryAllByTitle } = compareTable(true, true, mockDataRetrigger);
  const retriggerButtons = queryAllByTitle(
    compareTableText.retriggerButtonTitle,
  );

  expect(retriggerButtons).toHaveLength(2);
  await fireEvent.click(retriggerButtons[0]);

  expect(mockDataRetrigger.retriggers).toHaveLength(1);
  expect(mockDataRetrigger.retriggers[0].jobs).toHaveLength(1);
  expect(mockDataRetrigger.retriggers[0].jobs[0].id).toEqual(
    result[0].newJobIds[0],
  );
});

test('retrigger should not work on test with no jobs', async () => {
  const mockDataRetrigger = { retriggers: [] };
  const { queryAllByTitle } = compareTable(true, false, mockDataRetrigger);
  const retriggerButtons = queryAllByTitle(
    compareTableText.retriggerButtonTitle,
  );

  expect(retriggerButtons).toHaveLength(2);
  await fireEvent.click(retriggerButtons[1]);

  expect(mockDataRetrigger.retriggers).toHaveLength(0);
});
