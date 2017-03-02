import * as SwaggerSchema from 'swagger-schema-official';
export interface IApiExampleRequest {
    url: string;
    body: any;
}
export interface IApiExample {
    request?: IApiExampleRequest;
    response?: {
        [status: string]: any;
    };
    'x-exception'?: any;
    'x-request-schema'?: any;
    'x-responses-schema'?: any;
}
export interface IApiExampleData {
    [operationId: string]: IApiExample;
}
export declare function exemplify(apiSpec: SwaggerSchema.Spec, examples: IApiExampleData): IApiExampleData;
