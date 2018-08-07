import {
  BECCACCINO_REDUCER_NAME,
  beccaccinoSelector,
  takeNext,
  resultSelector,
  errorSelector,
  loadingSelector,
  cancelTokenSelector,
} from '@lib/redux-http';
import Beccaccino from '@lib/Beccaccino';

Beccaccino.configure({}, []);

const baseState = {
  [BECCACCINO_REDUCER_NAME]: {
    results: {
      request1: {
        requestDetails: {
          requestId: 'request1',
        },
        rawResponse: {},
        response: { data: ['test'] },
      },
    },
  },
};
Beccaccino.setLastDispatchedRequestId({
  endpoint: 'testEndpoint',
  id: 'request1',
});

describe('state selectors', () => {
  describe('beccaccinoSelector', () => {
    // it('Returns undefined if endpoint is not defined or without requests', () => {
    //   const result = beccaccinoSelector({
    //     state: {
    //       ...baseState, requestsMetadata: {
    //         missingEndpoint: {
    //           isLoading: false,
    //           success: true,
    //         },
    //       },
    //     },
    //     endpointName: 'missingEndpoint',
    //   });
    //   expect(result).toBeNull();
    // });
  });
  it('Returns the request and metadata for an existing endpoint', () => {
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request1',
      sessionId: 'session1',
    });
    const result = beccaccinoSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          requestsMetadata: {
            request1: {
              isLoading: false,
              success: true,
            },
          },
        },
      },
      endpointName: 'testEndpoint',
      sessionId: 'session1',
    });
    expect(result).toEqual([{
      result: { data: ['test'] },
      metadata: {
        isLoading: false,
        success: true,
      },
    }]);
  });
  it('Returns the request and metadata for an existing endpoint with limit of 2', () => {
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request1',
      sessionId: 'session2',
    });
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request2',
      sessionId: 'session2',
    });
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request3',
      sessionId: 'session2',
    });
    const result = beccaccinoSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          results: {
            ...baseState[BECCACCINO_REDUCER_NAME].results,
            request2: {
              requestDetails: {
                requestId: 'request2',
              },
              rawResponse: {},
              response: { data: ['test2'] },
            },
            request3: {
              requestDetails: {
                requestId: 'request3',
              },
              rawResponse: {},
              response: { data: ['test3'] },
            },
          },
          requestsMetadata: {
            request1: {
              isLoading: false,
              success: true,
            },
            request2: {
              isLoading: true,
              success: false,
            },
            request3: {
              isLoading: false,
              success: true,
            },
          },
        },
      },
      endpointName: 'testEndpoint',
      limit: 2,
      sessionId:'session2',
    });
    expect(result).toEqual([
      {
        result: { data: ['test'] },
        metadata: {
          isLoading: false,
          success: true,
        },
      },
      {
        result: { data: ['test2'] },
        metadata: {
          isLoading: true,
          success: false,
        },
      },
    ]);
  });

  it('Returns the request and undefined metadata for an existing endpoint', () => {
    const result = beccaccinoSelector({
      state: baseState,
      endpointName: 'testEndpoint',
      limit: 1,
    });
    expect(result).toEqual([{
      result: { data: ['test'] },
      metadata: undefined,
    }]);
  });

  it('Applies the map with custom function', () => {
    const result = beccaccinoSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          requestsMetadata: {
            request1: {
              isLoading: false,
              success: true,
            },
          },
        },
      },
      endpointName: 'testEndpoint',
      responseMapper: (meta: any, result: any) => (
        { foo: result.response.data, bar: meta.isLoading }
      ),
    });
    expect(result).toEqual([{
      foo: ['test'],
      bar: false,
    }]);
  });
});

describe('resultSelector', () => {
  it('Returns all the results of endpoint', () => {
    const result = resultSelector({
      endpointName: 'testEndpoint',
      state: baseState,
    });
    expect(result).toEqual([
      { data: ['test'] },
    ]);
  });
});

describe('takeNext decorator', () => {
  it('Returns undefined if there are no requests made for the endpoint', () => {
    const configuredSelector = takeNext(
      resultSelector, { limit: -1, endpointName: 'testEndpoint2', useDefaultSession: true },
    );
    const firstResult = configuredSelector.select(baseState);

    expect(firstResult).toBeNull();
  });
  it('Returns undefined if the requests are the same across different calls of selector', () => {
    const configuredSelector = takeNext(
      resultSelector, { limit: -1, endpointName: 'testEndpoint' },
    );
    const firstResult = configuredSelector.select(baseState);
    const secondResult = configuredSelector.select(baseState);
    expect(firstResult).toEqual(secondResult);
  });

  it('Returns the new request added after the firstr call of selector', () => {
    const configuredSelector = takeNext(
      resultSelector, { limit: -1, endpointName: 'testEndpoint' },
    );
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request2',
      sessionId: 'session4',
    });
    const firstResult = configuredSelector.select(baseState, 'session4');
    const enrichedState = {
      ...baseState,
      [BECCACCINO_REDUCER_NAME]: {
        ...baseState[BECCACCINO_REDUCER_NAME],
        results: {
          ...baseState[BECCACCINO_REDUCER_NAME].results,
          request2: {
            requestDetails: {
              requestId: 'request2',
            },
            rawResponse: {},
            response: { data: ['test2'] },
          },
        },
        requestsMetadata: {
          request1: {
            isLoading: false,
            success: true,
          },
          request2: {
            isLoading: true,
            success: false,
          },
        },
      },
    };
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request2',
      sessionId: 'session4',
    });
    const secondResult = configuredSelector.select(enrichedState, 'session4');
    expect(firstResult).toEqual([undefined]);
    expect(secondResult).toEqual([{ data: ['test2'] }]);
  });
});

describe('errorSelector', () => {
  it('Returns all the errors of endpoint calls', () => {
    const errors = errorSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          requestsMetadata: {
            request1: {
              isLoading: false,
              success: true,
            },
          },
        },
      },
      endpointName: 'testEndpoint',
    });
    expect(errors).toEqual([
      { error: false, response: { data: ['test'] } },
    ]);
  });
});

describe('loadingSelector', () => {
  it('Returns all the loading endpoint calls', () => {
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request1',
      sessionId: 'session5',
    });
    Beccaccino.setLastDispatchedRequestId({
      endpoint: 'testEndpoint',
      id: 'request2',
      sessionId: 'session5',
    });
    const loading = loadingSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          results: {
            ...baseState[BECCACCINO_REDUCER_NAME].results,
            request2: {
              requestDetails: {
                requestId: 'request2',
              },
              rawResponse: {},
              response: { data: ['test2'] },
            },
          },
          requestsMetadata: {
            request1: {
              isLoading: true,
              success: false,
            },
            request2: {
              isLoading: false,
              success: true,
            },
          },
        },
      },
      endpointName: 'testEndpoint',
      sessionId: 'session5',
    });
    expect(loading).toEqual([true, false]);
  });
});

describe('cancelTokenSelector', () => {
  it('Returns the cancel token', () => {
    const cancelCallback = () => 'cancelRequest';
    const params = {
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          results: {
            ...baseState[BECCACCINO_REDUCER_NAME].results,
            request1: {
              ...baseState[BECCACCINO_REDUCER_NAME].results['request1'],
              requestDetails: {
                cancelRequest: cancelCallback,
              },
            },
          },
        },
      },
      limit: 1,
      endpointName: 'testEndpoint',
    };
    const cancelToken = cancelTokenSelector(params);

    expect(cancelToken).toEqual([cancelCallback]);
  });
});
