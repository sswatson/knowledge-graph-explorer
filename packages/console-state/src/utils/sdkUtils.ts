import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { omit } from 'lodash-es';

import {
  TransactionAsync,
  TransactionAsyncCompact,
} from '@relationalai/rai-sdk-javascript';
import {
  ApiError,
  Client,
  Problem,
  QueryInput,
  SdkError,
  TransactionAsyncResult,
  TransactionAsyncState,
  TransactionError,
} from '@relationalai/rai-sdk-javascript/web';
import { Diagnostic, readResults } from '@relationalai/utils';

export enum TransactionTags {
  CONSOLE_USER = 'console-user',
  CONSOLE_INTERNAL = 'console-internal',
}

export function handleResponseAsync(
  result?:
    | TransactionAsyncResult
    | { transaction: TransactionAsyncResult['transaction'] },
  err?: SdkError,
  shouldLogProblems?: boolean,
) {
  const problems: Problem[] =
    (result as TransactionAsyncResult)?.problems || [];
  let error = convertError(err);

  const requestId = error?.requestId;

  // reporting non-network errors
  if (err && !('response' in err)) {
    datadogRum.addError(err);
  }

  if (shouldLogProblems) {
    reportProblemsToDatadog(problems);
  }

  if (
    result?.transaction.state === TransactionAsyncState.ABORTED &&
    !problems.length // if it's not aborted because of ICs
  ) {
    error = { message: 'Transaction has aborted.' };
  }

  if (result && 'results' in result) {
    const { output, diagnostics } = readResults(result.results);
    const transactionId = result?.transaction.id;

    return {
      output,
      problems,
      error,
      diagnostics,
      transactionId,
      requestId,
    };
  }

  return { output: [], diagnostics: [], problems, error, requestId };
}

export function convertError(err?: SdkError) {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      status: err.status,
      details: err.details,
      requestId: err.response?.headers?.get('x-request-id') ?? undefined,
    };
  }

  if (err instanceof TransactionError) {
    return {
      message: err.message,
      problems: err.result.problems,
      output: err.result.output.filter(r => r.rel_key.name === 'output'),
      requestId: err.response?.headers?.get('x-request-id') ?? undefined,
    };
  }

  return err ? { message: err.message } : undefined;
}

function reportProblemsToDatadog(problems: Problem[]) {
  problems.forEach(p => {
    if (p.type === 'ClientProblem') {
      datadogLogs.logger.info(
        `Problem - ${p.type} - ${p.error_code}`,
        // we don't want to expose parts of customer's query
        { problem: omit(p, ['report']) },
      );
    }

    if (p.type === 'IntegrityConstraintViolation') {
      datadogLogs.logger.info(`Problem - ${p.type}`, {
        problem: {
          ...p,
          sources: p.sources.map(s => omit(s, ['source'])),
        },
      });
    }
  });
}

export async function v2ListModels(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
) {
  return await sdkClient.exec(
    databaseId,
    engineName,
    `def output:__model__ = rel:catalog:model`,
    [],
    true,
    [TransactionTags.CONSOLE_INTERNAL],
  );
}

export async function v2loadModel(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
  modelName: string,
) {
  return await sdkClient.exec(
    databaseId,
    engineName,
    `def output:__model__ = raw"${modelName}", rel:catalog:model[raw"${modelName}"]`,
    [],
    true,
    [TransactionTags.CONSOLE_INTERNAL],
  );
}

export async function v2InstallModels(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
  models: { name: string; value: string }[],
) {
  const queryStrings: string[] = [];
  const queryInputs: QueryInput[] = [];

  models.forEach((m, index) => {
    const inputRelation = `__model_value__${index}__`;

    queryStrings.push(
      `def delete:rel:catalog:model[raw"${m.name}"] = rel:catalog:model[raw"${m.name}"]`,
      `def insert:rel:catalog:model[raw"${m.name}"] = ${inputRelation}`,
    );
    queryInputs.push({
      name: inputRelation,
      value: m.value,
    });
  });

  queryStrings.push(`def output:__model__ = rel:catalog:model`);

  return await sdkClient.exec(
    databaseId,
    engineName,
    queryStrings.join('\n'),
    queryInputs,
    false,
    [TransactionTags.CONSOLE_USER],
  );
}

export async function v2InstallModelAsync(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
  model: { name: string; value: string },
) {
  const inputRelation = `__model_value__`;
  const queryStrings = [
    `def delete:rel:catalog:model[raw"${model.name}"] = rel:catalog:model[raw"${model.name}"]`,
    `def insert:rel:catalog:model[raw"${model.name}"] = ${inputRelation}`,
    `def output:__model__ = raw"${model.name}", rel:catalog:model[raw"${model.name}"]`,
  ];
  const queryInputs: QueryInput[] = [
    { name: inputRelation, value: model.value },
  ];

  return await sdkClient.execAsync(
    databaseId,
    engineName,
    queryStrings.join('\n'),
    queryInputs,
    false,
    [TransactionTags.CONSOLE_USER],
  );
}

export async function v2DeleteModels(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
  modelNames: string[],
) {
  const queryStrings = modelNames.map(
    name =>
      `def delete:rel:catalog:model[raw"${name}"] = rel:catalog:model[raw"${name}"]`,
  );

  queryStrings.push(`def output:__model__ = rel:catalog:model`);

  return await sdkClient.exec(
    databaseId,
    engineName,
    queryStrings.join('\n'),
    [],
    false,
    [TransactionTags.CONSOLE_USER],
  );
}

export async function v2RenameModel(
  sdkClient: Client,
  databaseId: string,
  engineName: string,
  modelName: string,
  newModelName: string,
) {
  const queryStrings = [
    `def delete:rel:catalog:model[raw"${modelName}"] = rel:catalog:model[raw"${modelName}"]`,
    `def insert:rel:catalog:model[raw"${newModelName}"] = rel:catalog:model[raw"${modelName}"]`,
    `def output:__model__ = rel:catalog:model`,
  ];

  return await sdkClient.exec(
    databaseId,
    engineName,
    queryStrings.join('\n'),
    [],
    false,
    [TransactionTags.CONSOLE_USER],
  );
}

export async function checkSystemInternals(
  sdkClient: Client,
  transaction: TransactionAsync | TransactionAsyncCompact,
  diagnostics: Diagnostic[] = [],
) {
  if (transaction.state == TransactionAsyncState.ABORTED) {
    let abortReason = (transaction as TransactionAsync).abort_reason;

    // if the transaction type TransactionAsyncCompact, the abort reason is missing
    if (!abortReason) {
      const t = await sdkClient.getTransaction(transaction.id);

      abortReason = t.abort_reason;
    }

    if (abortReason === 'system internal error' && diagnostics.length === 0) {
      throw {
        name: 'System internal error',
        message:
          'An unexpected exception occurred while executing the transaction.',
      };
    }
  }
}
