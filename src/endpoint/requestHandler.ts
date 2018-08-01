import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { ErrorTransform, ResponseTransform, EndpointResponse } from '@lib/endpoint';

const defaulTransformFunction = (x: any): any => x;
const defaultErrorTransformFunction = (x: any): any => x;

type RequestHandlerParams = {
  requestConfiguration: AxiosRequestConfig,
  errorTransformer?: ErrorTransform,
  responseTransformer?: ResponseTransform,
  axiosInstance: AxiosInstance,
};
export default function requestHandler({
  requestConfiguration,
  errorTransformer = defaultErrorTransformFunction,
  axiosInstance,
  responseTransformer = defaulTransformFunction,
}: RequestHandlerParams): Promise<EndpointResponse> {
  return axiosInstance.request(requestConfiguration)
    .then(response => ({
      rawResponse: response,
      data: responseTransformer(response.data),
      success: true,
    })).catch(error => ({
      rawResponse: error.response || {},
      data: error.response ? errorTransformer(error.response.data) : undefined,
      success: false,
    }));
}
