import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { shallowToJson } from 'enzyme-to-json';
import { MemoryRouter, Route } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import { CATALOG_API_BASE } from '../../../utilities/constants';
import { FETCH_PORTFOLIOS } from '../../../redux/action-types';
import Portfolios from '../../../smart-components/portfolio/portfolios';
import PortfolioCard from '../../../presentational-components/portfolio/porfolio-card';
import { CardLoader } from '../../../presentational-components/shared/loader-placeholders';
import { mockApi } from '../../__mocks__/user-login';

describe('<Portfolios />', () => {
  let initialProps;
  let initialState;
  const middlewares = [thunk, promiseMiddleware, notificationsMiddleware()];
  let mockStore;

  const ComponentWrapper = ({ store, initialEntries = ['/foo'], children }) => (
    <Provider store={store} value={{ userPermissions: [] }}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  );

  beforeEach(() => {
    initialProps = {
      id: '123'
    };
    initialState = {
      breadcrumbsReducer: { fragments: [] },
      portfolioReducer: {
        portfolios: {
          data: [
            {
              id: '123',
              name: 'bar',
              description: 'description',
              modified: 'sometimes',
              created_at: 'foo',
              owner: 'Owner',
              metadata: {
                user_capabilities: {
                  share: true,
                  unshare: true,
                  update: true,
                  destroy: true
                }
              }
            }
          ],
          meta: {
            limit: 50,
            offset: 0
          }
        }
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render correctly', () => {
    const store = mockStore(initialState);
    const wrapper = shallow(
      <ComponentWrapper store={store} initialEntries={['/portfolios']}>
        <Portfolios {...initialProps} store={store} />
      </ComponentWrapper>
    ).find(Portfolios);
    expect(shallowToJson(wrapper)).toMatchSnapshot();
  });

  it('should mount and fetch data', async (done) => {
    const store = mockStore(initialState);

    mockApi
      .onGet(
        `${CATALOG_API_BASE}/portfolios?filter[name][contains_i]=&limit=50&offset=0`
      )
      .replyOnce(200, { data: [{ name: 'Foo', id: '11' }] });
    const expectedActions = [
      {
        type: `${FETCH_PORTFOLIOS}_PENDING`,
        meta: { filter: '' }
      },
      expect.objectContaining({
        type: `${FETCH_PORTFOLIOS}_FULFILLED`
      })
    ];

    await act(async () => {
      mount(
        <ComponentWrapper store={store} initialEntries={['/portfolios']}>
          <Route
            path="/portfolios"
            render={(args) => <Portfolios {...initialProps} {...args} />}
          />
        </ComponentWrapper>
      );
    });

    expect(store.getActions()).toEqual(expectedActions);
    done();
  });

  it('should mount and filter portfolios', async (done) => {
    expect.assertions(2);
    const store = mockStore(initialState);

    mockApi
      .onGet(
        `${CATALOG_API_BASE}/portfolios?filter[name][contains_i]=&limit=50&offset=0`
      )
      .replyOnce(200, { data: [{ name: 'Foo', id: '11' }] });

    mockApi
      .onGet(
        `${CATALOG_API_BASE}/portfolios?filter[name][contains_i]=nothing&limit=50&offset=0`
      )
      .replyOnce((req) => {
        expect(req).toBeTruthy();
        done();
        return [200, { data: [] }];
      });

    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ComponentWrapper store={store} initialEntries={['/portfolios']}>
          <Route
            path="/portfolios"
            render={(args) => <Portfolios {...initialProps} {...args} />}
          />
        </ComponentWrapper>
      );
    });

    wrapper.update();
    expect(wrapper.find(PortfolioCard)).toHaveLength(1);
    const filterInput = wrapper.find('input').first();

    await act(async () => {
      filterInput.getDOMNode().value = 'nothing';
    });

    await act(async () => {
      filterInput.simulate('change', { target: { value: 'nothing' } });
    });
  });

  it('should render in loading state', async (done) => {
    const store = mockStore({
      ...initialState,
      portfolioReducer: {
        ...initialState.portfolioReducer,
        isLoading: true,
        portfolios: { data: [], meta: { limit: 50, offset: 0 } }
      }
    });
    mockApi
      .onGet(
        `${CATALOG_API_BASE}/portfolios?filter[name][contains_i]=&limit=50&offset=0`
      )
      .replyOnce(200, { data: [{ name: 'Foo', id: '11' }] });
    let wrapper;
    await act(async () => {
      wrapper = mount(
        <ComponentWrapper store={store} initialEntries={['/portfolios']}>
          <Route
            exact
            path="/portfolios"
            render={(props) => <Portfolios {...initialProps} {...props} />}
          />
        </ComponentWrapper>
      );
    });

    expect(wrapper.find(CardLoader)).toHaveLength(1);
    done();
  });
});
