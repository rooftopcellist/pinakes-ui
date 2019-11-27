import React from 'react';
import { act } from 'react-dom/test-utils';
import thunk from 'redux-thunk';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store' ;
import { MemoryRouter } from 'react-router-dom';
import promiseMiddleware from 'redux-promise-middleware';
import { notificationsMiddleware } from '@redhat-cloud-services/frontend-components-notifications/';

import Products from '../../../smart-components/products/products';
import { CATALOG_API_BASE, SOURCES_API_BASE } from '../../../utilities/constants';
import { CardLoader } from '../../../presentational-components/shared/loader-placeholders';
import ContentGalleryEmptyState from '../../../presentational-components/shared/content-gallery-empty-state';
import { mockApi, mockGraphql } from '../../__mocks__/user-login';

describe('<Products />', () => {
  let initialState;

  const middlewares = [ thunk, promiseMiddleware, notificationsMiddleware() ];
  let mockStore;

  const ComponentWrapper = ({ store, initialEntries = [ '/foo' ], children }) => (
    <Provider store={ store }>
      <MemoryRouter initialEntries={ initialEntries }>
        { children }
      </MemoryRouter>
    </Provider>
  );

  afterEach(() => {
    mockGraphql.reset();
  });

  beforeEach(() => {
    initialState = {
      portfolioReducer: {
        portfolioItems: {
          data: [{
            name: 'Foo',
            id: '123'
          }],
          meta: {
            limit: 0,
            offset: 0,
            count: 1
          }
        }
      }
    };
    mockStore = configureStore(middlewares);
  });

  it('should render in loading state', async done => {
    const store = mockStore(initialState);
    mockApi.onGet(`${CATALOG_API_BASE}/portfolio_items?filter[name][contains_i]=&limit=50&offset=0`).replyOnce(200,
      { data: [], meta: {
        limit: 0,
        offset: 0,
        count: 0
      }});
    mockGraphql.onPost(`${SOURCES_API_BASE}/graphql`).replyOnce(200, { data: []});

    let wrapper;

    await act(async () => {
      wrapper = mount(<ComponentWrapper store={ store }><Products /></ComponentWrapper>);
      expect(wrapper.find(CardLoader)).toHaveLength(1);
    });

    wrapper.update();
    expect(wrapper.find(CardLoader)).toHaveLength(0);

    done();
  });

  it('should call debounced async filter after 1 second', async done => {
    expect.assertions(1);
    const store = mockStore(initialState);
    mockApi.onGet(`${CATALOG_API_BASE}/portfolio_items?filter[name][contains_i]=&limit=50&offset=0`).replyOnce(200, {
      data: [], meta: {
        limit: 0,
        offset: 0,
        count: 0
      }});
    /**
     * Second call after input change
     */
    mockApi.onGet(`${CATALOG_API_BASE}/portfolio_items?filter[name][contains_i]=foo&limit=50&offset=0`).replyOnce(req => {
      expect(req).toBeTruthy();
      done();
      return [ 200, { data: []}];
    });
    mockGraphql.onPost(`${SOURCES_API_BASE}/graphql`).replyOnce(200, { data: []});

    let wrapper;

    await act(async () => {
      wrapper = mount(<ComponentWrapper store={ store }><Products /></ComponentWrapper>);
    });

    wrapper.update();
    const input = wrapper.find('input').first();

    await act(async () => {
      input.getDOMNode().value = 'foo';
    });
    await act(async () => {
      input.simulate('change');
    });
  });

  it('should render gallery in empty state', async done => {
    const store = mockStore({
      portfolioReducer: {
        portfolioItems: {
          data: [],
          meta: {
            limit: 0,
            offset: 0,
            count: 0
          }
        }
      }
    });
    mockApi.onGet(`${CATALOG_API_BASE}/portfolio_items?filter[name][contains_i]=&limit=50&offset=0`)
    .replyOnce(200, {
      data: [], meta: {
        limit: 0,
        offset: 0,
        count: 0
      }
    });
    mockGraphql.onPost(`${SOURCES_API_BASE}/graphql`).replyOnce(200, { data: []});

    let wrapper;

    await act(async () => {
      wrapper = mount(<ComponentWrapper store={ store }><Products /></ComponentWrapper>);
    });

    wrapper.update();
    expect(wrapper.find(ContentGalleryEmptyState)).toHaveLength(1);
    done();
  });
});