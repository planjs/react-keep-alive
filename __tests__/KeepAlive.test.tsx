import React from 'react';
import {
  render,
  getByTestId,
  cleanup,
  getNodeText,
  fireEvent,
  waitFor,
  getByText,
} from '@testing-library/react';

import { Provider, KeepAlive } from '../src';

const Counter: React.FC = () => {
  const [count, setCount] = React.useState(0);

  const handleAdd = React.useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <div>
      <div data-testid="count">{count}</div>
      <button data-testid="counterAdd" onClick={handleAdd}>
        +
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [show, setShow] = React.useState(true);

  const handleToggleShow = React.useCallback(() => {
    setShow(!show);
  }, [show]);

  return (
    <Provider>
      <div>
        {show}
        {show ? (
          <KeepAlive key="counter">
            <Counter />
          </KeepAlive>
        ) : null}
        <button data-testid="toggle" onClick={handleToggleShow}>
          toggle
        </button>
      </div>
    </Provider>
  );
};

test('Test <KeepAlive />', async () => {
  afterEach(cleanup);
  const { container } = render(<App />);
  await waitFor(() => getByTestId(container, 'count'));

  const getCount = () => getByTestId(container, 'count');
  // init state
  expect(container).toMatchSnapshot();
  expect(getNodeText(getCount())).toBe('0');

  // add count
  const counterAdd = getByTestId(container, 'counterAdd');
  fireEvent.click(counterAdd);
  expect(container).toMatchSnapshot();
  expect(getNodeText(getCount())).toBe('1');

  // hide Counter
  const toggleBtn = getByTestId(container, 'toggle');
  fireEvent.click(toggleBtn);
  try {
    await waitFor(() => getByTestId(container, 'count'));
  } catch (e) {
    expect(e.message).toMatch('Unable to find an element');
    expect(container).toMatchSnapshot();
  }

  // show Counter
  fireEvent.click(toggleBtn);
  expect(container).toMatchSnapshot();
  expect(getNodeText(getCount())).toBe('1');
});
