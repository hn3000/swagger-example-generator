import * as SwaggerSchema from 'swagger-schema-official';
export interface IApiExampleRequest {
    url: string;
    body: any;
}
export interface IApiExample {
    request?: IApiExampleRequest;
    requests?: IApiExampleRequest[];
    response?: {
        [status: string]: any;
    };
    'x-exception'?: any;
    'x-request-schema'?: any;
    'x-responses-schema'?: any;
}
export interface IExemplifyOptions {
    examples: IApiExampleData;
    requestExamples?: number;
    responseExamples?: number;
    showAllFields?: boolean;
}
export interface IApiExampleData {
    [operationId: string]: IApiExample;
}
export declare function exemplify(apiSpec: SwaggerSchema.Spec, options: IExemplifyOptions): IApiExampleData;
export declare function different<X extends any>(a: X, b: X): boolean;
