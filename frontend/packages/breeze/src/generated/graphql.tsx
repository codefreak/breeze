import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
};


export type FileSystemNode = {
  path: Scalars['String'];
  modified: Scalars['DateTime'];
};

export type Directory = FileSystemNode & {
   __typename?: 'Directory';
  path: Scalars['String'];
  modified: Scalars['DateTime'];
};

export type File = FileSystemNode & {
   __typename?: 'File';
  path: Scalars['String'];
  modified: Scalars['DateTime'];
  size: Scalars['Int'];
  contents: Scalars['String'];
};

export enum FileSystemEventType {
  Created = 'CREATED',
  Deleted = 'DELETED',
  Modified = 'MODIFIED'
}

export type FilesystemEvent = {
   __typename?: 'FilesystemEvent';
  type: FileSystemEventType;
  path: Scalars['String'];
};

export type Query = {
   __typename?: 'Query';
  files: Array<FileSystemNode>;
  file?: Maybe<FileSystemNode>;
};


export type QueryFileArgs = {
  path: Scalars['String'];
};

export enum ReplType {
  Default = 'DEFAULT',
  Run = 'RUN'
}

export type Mutation = {
   __typename?: 'Mutation';
  writeFile: FileSystemNode;
  createRepl: Scalars['ID'];
  killRepl?: Maybe<Scalars['Int']>;
  writeRepl?: Maybe<Scalars['Int']>;
  resizeRepl?: Maybe<Scalars['Boolean']>;
};


export type MutationWriteFileArgs = {
  path: Scalars['String'];
  contents: Scalars['String'];
};


export type MutationCreateReplArgs = {
  type?: Maybe<ReplType>;
};


export type MutationKillReplArgs = {
  id: Scalars['ID'];
};


export type MutationWriteReplArgs = {
  id: Scalars['ID'];
  data: Scalars['String'];
};


export type MutationResizeReplArgs = {
  id: Scalars['ID'];
  cols: Scalars['Int'];
  rows: Scalars['Int'];
};

export type Subscription = {
   __typename?: 'Subscription';
  fileChange: FilesystemEvent;
  replOutput: Scalars['String'];
  replWait: Scalars['Int'];
};


export type SubscriptionReplOutputArgs = {
  id: Scalars['ID'];
};


export type SubscriptionReplWaitArgs = {
  id: Scalars['ID'];
};

export type GetFilesQueryVariables = {};


export type GetFilesQuery = (
  { __typename?: 'Query' }
  & { files: Array<(
    { __typename?: 'Directory' }
    & Pick<Directory, 'modified' | 'path'>
  ) | (
    { __typename?: 'File' }
    & Pick<File, 'modified' | 'path'>
  )> }
);

export type GetFileQueryVariables = {
  path: Scalars['String'];
};


export type GetFileQuery = (
  { __typename?: 'Query' }
  & { file?: Maybe<{ __typename?: 'Directory' } | (
    { __typename?: 'File' }
    & Pick<File, 'contents' | 'modified' | 'path'>
  )> }
);

export type WriteFileMutationVariables = {
  path: Scalars['String'];
  contents: Scalars['String'];
};


export type WriteFileMutation = (
  { __typename?: 'Mutation' }
  & { writeFile: (
    { __typename?: 'Directory' }
    & Pick<Directory, 'modified' | 'path'>
  ) | (
    { __typename?: 'File' }
    & Pick<File, 'contents' | 'modified' | 'path'>
  ) }
);

export type FileChangedSubscriptionVariables = {};


export type FileChangedSubscription = (
  { __typename?: 'Subscription' }
  & { fileChange: (
    { __typename?: 'FilesystemEvent' }
    & Pick<FilesystemEvent, 'path' | 'type'>
  ) }
);

export type CreateReplMutationVariables = {
  type: ReplType;
};


export type CreateReplMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'createRepl'>
);

export type WriteReplDataMutationVariables = {
  id: Scalars['ID'];
  data: Scalars['String'];
};


export type WriteReplDataMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'writeRepl'>
);

export type ResizeReplMutationVariables = {
  id: Scalars['ID'];
  cols: Scalars['Int'];
  rows: Scalars['Int'];
};


export type ResizeReplMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'resizeRepl'>
);

export type ReplOutputSubscriptionVariables = {
  id: Scalars['ID'];
};


export type ReplOutputSubscription = (
  { __typename?: 'Subscription' }
  & Pick<Subscription, 'replOutput'>
);

export type ReplWaitSubscriptionVariables = {
  id: Scalars['ID'];
};


export type ReplWaitSubscription = (
  { __typename?: 'Subscription' }
  & Pick<Subscription, 'replWait'>
);


export const GetFilesDocument = gql`
    query GetFiles {
  files {
    modified
    path
  }
}
    `;

/**
 * __useGetFilesQuery__
 *
 * To run a query within a React component, call `useGetFilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFilesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetFilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetFilesQuery, GetFilesQueryVariables>) {
        return ApolloReactHooks.useQuery<GetFilesQuery, GetFilesQueryVariables>(GetFilesDocument, baseOptions);
      }
export function useGetFilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFilesQuery, GetFilesQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<GetFilesQuery, GetFilesQueryVariables>(GetFilesDocument, baseOptions);
        }
export type GetFilesQueryHookResult = ReturnType<typeof useGetFilesQuery>;
export type GetFilesLazyQueryHookResult = ReturnType<typeof useGetFilesLazyQuery>;
export type GetFilesQueryResult = ApolloReactCommon.QueryResult<GetFilesQuery, GetFilesQueryVariables>;
export const GetFileDocument = gql`
    query GetFile($path: String!) {
  file(path: $path) {
    ... on File {
      contents
      modified
      path
    }
  }
}
    `;

/**
 * __useGetFileQuery__
 *
 * To run a query within a React component, call `useGetFileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFileQuery({
 *   variables: {
 *      path: // value for 'path'
 *   },
 * });
 */
export function useGetFileQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
        return ApolloReactHooks.useQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, baseOptions);
      }
export function useGetFileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetFileQuery, GetFileQueryVariables>) {
          return ApolloReactHooks.useLazyQuery<GetFileQuery, GetFileQueryVariables>(GetFileDocument, baseOptions);
        }
export type GetFileQueryHookResult = ReturnType<typeof useGetFileQuery>;
export type GetFileLazyQueryHookResult = ReturnType<typeof useGetFileLazyQuery>;
export type GetFileQueryResult = ApolloReactCommon.QueryResult<GetFileQuery, GetFileQueryVariables>;
export const WriteFileDocument = gql`
    mutation WriteFile($path: String!, $contents: String!) {
  writeFile(path: $path, contents: $contents) {
    modified
    path
    ... on File {
      contents
    }
  }
}
    `;
export type WriteFileMutationFn = ApolloReactCommon.MutationFunction<WriteFileMutation, WriteFileMutationVariables>;

/**
 * __useWriteFileMutation__
 *
 * To run a mutation, you first call `useWriteFileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useWriteFileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [writeFileMutation, { data, loading, error }] = useWriteFileMutation({
 *   variables: {
 *      path: // value for 'path'
 *      contents: // value for 'contents'
 *   },
 * });
 */
export function useWriteFileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<WriteFileMutation, WriteFileMutationVariables>) {
        return ApolloReactHooks.useMutation<WriteFileMutation, WriteFileMutationVariables>(WriteFileDocument, baseOptions);
      }
export type WriteFileMutationHookResult = ReturnType<typeof useWriteFileMutation>;
export type WriteFileMutationResult = ApolloReactCommon.MutationResult<WriteFileMutation>;
export type WriteFileMutationOptions = ApolloReactCommon.BaseMutationOptions<WriteFileMutation, WriteFileMutationVariables>;
export const FileChangedDocument = gql`
    subscription FileChanged {
  fileChange {
    path
    type
  }
}
    `;

/**
 * __useFileChangedSubscription__
 *
 * To run a query within a React component, call `useFileChangedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useFileChangedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFileChangedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useFileChangedSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<FileChangedSubscription, FileChangedSubscriptionVariables>) {
        return ApolloReactHooks.useSubscription<FileChangedSubscription, FileChangedSubscriptionVariables>(FileChangedDocument, baseOptions);
      }
export type FileChangedSubscriptionHookResult = ReturnType<typeof useFileChangedSubscription>;
export type FileChangedSubscriptionResult = ApolloReactCommon.SubscriptionResult<FileChangedSubscription>;
export const CreateReplDocument = gql`
    mutation CreateRepl($type: REPLType!) {
  createRepl(type: $type)
}
    `;
export type CreateReplMutationFn = ApolloReactCommon.MutationFunction<CreateReplMutation, CreateReplMutationVariables>;

/**
 * __useCreateReplMutation__
 *
 * To run a mutation, you first call `useCreateReplMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateReplMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createReplMutation, { data, loading, error }] = useCreateReplMutation({
 *   variables: {
 *      type: // value for 'type'
 *   },
 * });
 */
export function useCreateReplMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateReplMutation, CreateReplMutationVariables>) {
        return ApolloReactHooks.useMutation<CreateReplMutation, CreateReplMutationVariables>(CreateReplDocument, baseOptions);
      }
export type CreateReplMutationHookResult = ReturnType<typeof useCreateReplMutation>;
export type CreateReplMutationResult = ApolloReactCommon.MutationResult<CreateReplMutation>;
export type CreateReplMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateReplMutation, CreateReplMutationVariables>;
export const WriteReplDataDocument = gql`
    mutation WriteReplData($id: ID!, $data: String!) {
  writeRepl(id: $id, data: $data)
}
    `;
export type WriteReplDataMutationFn = ApolloReactCommon.MutationFunction<WriteReplDataMutation, WriteReplDataMutationVariables>;

/**
 * __useWriteReplDataMutation__
 *
 * To run a mutation, you first call `useWriteReplDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useWriteReplDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [writeReplDataMutation, { data, loading, error }] = useWriteReplDataMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useWriteReplDataMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<WriteReplDataMutation, WriteReplDataMutationVariables>) {
        return ApolloReactHooks.useMutation<WriteReplDataMutation, WriteReplDataMutationVariables>(WriteReplDataDocument, baseOptions);
      }
export type WriteReplDataMutationHookResult = ReturnType<typeof useWriteReplDataMutation>;
export type WriteReplDataMutationResult = ApolloReactCommon.MutationResult<WriteReplDataMutation>;
export type WriteReplDataMutationOptions = ApolloReactCommon.BaseMutationOptions<WriteReplDataMutation, WriteReplDataMutationVariables>;
export const ResizeReplDocument = gql`
    mutation ResizeRepl($id: ID!, $cols: Int!, $rows: Int!) {
  resizeRepl(id: $id, cols: $cols, rows: $rows)
}
    `;
export type ResizeReplMutationFn = ApolloReactCommon.MutationFunction<ResizeReplMutation, ResizeReplMutationVariables>;

/**
 * __useResizeReplMutation__
 *
 * To run a mutation, you first call `useResizeReplMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResizeReplMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resizeReplMutation, { data, loading, error }] = useResizeReplMutation({
 *   variables: {
 *      id: // value for 'id'
 *      cols: // value for 'cols'
 *      rows: // value for 'rows'
 *   },
 * });
 */
export function useResizeReplMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ResizeReplMutation, ResizeReplMutationVariables>) {
        return ApolloReactHooks.useMutation<ResizeReplMutation, ResizeReplMutationVariables>(ResizeReplDocument, baseOptions);
      }
export type ResizeReplMutationHookResult = ReturnType<typeof useResizeReplMutation>;
export type ResizeReplMutationResult = ApolloReactCommon.MutationResult<ResizeReplMutation>;
export type ResizeReplMutationOptions = ApolloReactCommon.BaseMutationOptions<ResizeReplMutation, ResizeReplMutationVariables>;
export const ReplOutputDocument = gql`
    subscription ReplOutput($id: ID!) {
  replOutput(id: $id)
}
    `;

/**
 * __useReplOutputSubscription__
 *
 * To run a query within a React component, call `useReplOutputSubscription` and pass it any options that fit your needs.
 * When your component renders, `useReplOutputSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReplOutputSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReplOutputSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<ReplOutputSubscription, ReplOutputSubscriptionVariables>) {
        return ApolloReactHooks.useSubscription<ReplOutputSubscription, ReplOutputSubscriptionVariables>(ReplOutputDocument, baseOptions);
      }
export type ReplOutputSubscriptionHookResult = ReturnType<typeof useReplOutputSubscription>;
export type ReplOutputSubscriptionResult = ApolloReactCommon.SubscriptionResult<ReplOutputSubscription>;
export const ReplWaitDocument = gql`
    subscription ReplWait($id: ID!) {
  replWait(id: $id)
}
    `;

/**
 * __useReplWaitSubscription__
 *
 * To run a query within a React component, call `useReplWaitSubscription` and pass it any options that fit your needs.
 * When your component renders, `useReplWaitSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useReplWaitSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useReplWaitSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<ReplWaitSubscription, ReplWaitSubscriptionVariables>) {
        return ApolloReactHooks.useSubscription<ReplWaitSubscription, ReplWaitSubscriptionVariables>(ReplWaitDocument, baseOptions);
      }
export type ReplWaitSubscriptionHookResult = ReturnType<typeof useReplWaitSubscription>;
export type ReplWaitSubscriptionResult = ApolloReactCommon.SubscriptionResult<ReplWaitSubscription>;