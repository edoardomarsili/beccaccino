import {
  BECCACCINO_REDUCER_NAME,
  beccaccinoSelector,
  takeNext,
  takeLast,
  resultSelector,
  errorSelector,
  loadingSelector,
  cancelTokenSelector,
  RESULT,
  ERROR,
  LOADING,
  CANCEL_TOKEN,
} from '@lib/redux-http';
import Beccaccino from '@lib/Beccaccino';

Beccaccino.configure({}, []);

const baseState = {
  [BECCACCINO_REDUCER_NAME]: {
    requestsLog: {
      'testEndpoint': ['request1']
    },
    results: {
      'request1': {
        requestDetails: {
          requestId: 'request1',
        },
        rawResponse: {},
        response: { data: ['test'] },
      },
    },
  },
};

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
    const result = beccaccinoSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          requestsLog: {
            'testEndpoint': ['request1', 'request2'],
          },
          results: {
            ...baseState[BECCACCINO_REDUCER_NAME].results,
            'request2': {
              requestDetails: {
                requestId: 'request2',
              },
              rawResponse: {},
              response: { data: ['test2'] },
            },
            'request3': {
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
      responseMapper: (meta: any, result: any) => ({ foo: result.response.data, bar: meta.isLoading }),
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
  beforeEach(() => {
    Beccaccino.getClientInstance().metadata['testEndpoint'] = {
      lastDispatchedRequestId: 'request1',
    };
  });
  it('Returns undefined if there are no requests made for the endpoint', () => {
    const configuredSelector = takeNext(
      RESULT, { limit: -1, endpointName: 'testEndpoint2' },
    );
    const firstResult = configuredSelector.select(baseState);

    expect(firstResult).toBeNull();
  })
  it('Returns undefined if the requests are the same across different calls of selector', () => {
    const configuredSelector = takeNext(
      RESULT, { limit: -1, endpointName: 'testEndpoint' },
    );
    const firstResult = configuredSelector.select(baseState);
    const secondResult = configuredSelector.select(baseState);
    expect(firstResult).toEqual(secondResult);
  });

  it('Returns the new request added after the firstr call of selector', () => {
    const configuredSelector = takeNext(
      RESULT, { limit: -1, endpointName: 'testEndpoint' },
    );
    const firstResult = configuredSelector.select(baseState);
    const enrichedState = {
      ...baseState,
      [BECCACCINO_REDUCER_NAME]: {
        ...baseState[BECCACCINO_REDUCER_NAME],
        results: {
          ...baseState[BECCACCINO_REDUCER_NAME].results,
          'request2': {
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
        requestsLog: {
          'testEndpoint': ['request1', 'request2'],
        },
      },
    };
    Beccaccino.getClientInstance().metadata['testEndpoint'].lastDispatchedRequestId = 'request2';
    const secondResult = configuredSelector.select(enrichedState);
    expect(firstResult).toBeUndefined();
    expect(secondResult).toEqual([{ data: ['test2'] }]);
  });
  it('Returns the new request added after the firstr call of selector', () => {
    const configuredSelector = takeNext(
      RESULT, { limit: -2, endpointName: 'testEndpoint' },
    );
    const firstResult = configuredSelector.select(baseState);
    const stateAfterFirstNextRequest = {
      ...baseState,
      [BECCACCINO_REDUCER_NAME]: {
        ...baseState[BECCACCINO_REDUCER_NAME],
        results: {
          ...baseState[BECCACCINO_REDUCER_NAME].results,
          'request2': {
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
        requestsLog: {
          'testEndpoint': ['request1', 'request2'],
        },
      },
    };
    Beccaccino.getClientInstance().metadata['testEndpoint'].lastDispatchedRequestId = 'request2';
    const secondResult = configuredSelector.select(stateAfterFirstNextRequest);
    expect(firstResult).toBeUndefined();
    expect(secondResult).toEqual([{ data: ['test2'] }]);
    const stateAfterSecondNextRequest = {
      ...stateAfterFirstNextRequest,
      [BECCACCINO_REDUCER_NAME]: {
        ...stateAfterFirstNextRequest[BECCACCINO_REDUCER_NAME],
        results: {
          ...stateAfterFirstNextRequest[BECCACCINO_REDUCER_NAME].results,
          'request3': {
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
            isLoading: true,
            success: false,
          },
        },
        requestsLog: {
          'testEndpoint': ['request1', 'request2', 'request3'],
        },
      },
    };
    Beccaccino.getClientInstance().metadata['testEndpoint'].lastDispatchedRequestId = 'request3';
    const thirdResult = configuredSelector.select(stateAfterSecondNextRequest);
    expect(thirdResult).toEqual([{ data: ['test2'] }, { data: ['test3'] }]);
  });
});

describe('takeLast decorator', () => {
  beforeEach(() => {
    Beccaccino.getClientInstance().metadata['testEndpoint'] = {
      lastDispatchedRequestId: 'request1',
    };
  });
  it('Returns undefined if there are no requests made for the endpoint', () => {
    const configuredSelector = takeLast(
      RESULT, { limit: -1, endpointName: 'testEndpoint2' },
    );
    const firstResult = configuredSelector.select(baseState);

    expect(firstResult).toBeNull();
  })
  it('Returns undefined if the requests are the same across different calls of selector', () => {
    const configuredSelector = takeLast(
      RESULT, { limit: -2, endpointName: 'testEndpoint' },
    );
    const firstResult = configuredSelector.select(baseState);
    const secondResult = configuredSelector.select(baseState);
    expect(firstResult).toEqual(secondResult);
  });

  it('Returns the new request added after the first call of selector with results', () => {
    const configuredSelector = takeLast(
      RESULT, { limit: -2, endpointName: 'testEndpoint' },
    );
    const stateAfterFirstNextRequest = {
      ...baseState,
      [BECCACCINO_REDUCER_NAME]: {
        ...baseState[BECCACCINO_REDUCER_NAME],
        results: {
          ...baseState[BECCACCINO_REDUCER_NAME].results,
          'request2': {
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
        requestsLog: {
          'testEndpoint': ['request1', 'request2'],
        },
      },
    };
    Beccaccino.getClientInstance().metadata['testEndpoint'].lastDispatchedRequestId = 'request2';
    const firstResult = configuredSelector.select(stateAfterFirstNextRequest);
    expect(firstResult).toEqual([{ data: ['test2'] }]);
    const stateAfterSecondNextRequest = {
      ...stateAfterFirstNextRequest,
      [BECCACCINO_REDUCER_NAME]: {
        ...stateAfterFirstNextRequest[BECCACCINO_REDUCER_NAME],
        results: {
          ...stateAfterFirstNextRequest[BECCACCINO_REDUCER_NAME].results,
          'request3': {
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
            isLoading: true,
            success: false,
          },
        },
        requestsLog: {
          'testEndpoint': ['request1', 'request2', 'request3'],
        },
      },
    };
    Beccaccino.getClientInstance().metadata['testEndpoint'].lastDispatchedRequestId = 'request3';
    const secondResult = configuredSelector.select(stateAfterSecondNextRequest);
    expect(secondResult).toEqual([{ data: ['test3'] }]);
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
    const loading = loadingSelector({
      state: {
        ...baseState,
        [BECCACCINO_REDUCER_NAME]: {
          ...baseState[BECCACCINO_REDUCER_NAME],
          results: {
            ...baseState[BECCACCINO_REDUCER_NAME].results,
            'request2': {
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
              success: true
            }
          },
          requestsLog: {
            'testEndpoint': ['request1', 'request2'],
          },
        },
      },
      endpointName: 'testEndpoint',
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
            'request1': {
              ...baseState[BECCACCINO_REDUCER_NAME].results['request1'],
              requestDetails: {
                cancelRequest: cancelCallback,
              },
            },
          },
        }
      },
      limit: 1,
      endpointName: 'testEndpoint',
    };
    const cancelToken = cancelTokenSelector(params);

    expect(cancelToken).toEqual([cancelCallback]);
  });
});
