import { get } from 'lodash-es';
import { useLayoutEffect, useRef, useState } from 'react';
import {
  Debug,
  Error,
  Info,
  LoggerInterface,
  version as vegaVersion,
  View,
  Warn,
} from 'vega';
import embed, { VisualizationSpec } from 'vega-embed';
import { version as vegaliteVersion } from 'vega-lite';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { Alert, Button } from '@relationalai/ui';
import { copyToClipboard, toObject } from '@relationalai/utils';

import { getMimeType, toJson } from '../outputUtils';

// Get the major version from a semantic version string
function getMajorVersion(version: string) {
  return version.split('.')[0];
}

type VegaProps = {
  relations: ArrowRelation[];
};

export default function Vega({ relations }: VegaProps) {
  const domReference = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState<
    { type: string; message: string | JSX.Element; action?: JSX.Element }[]
  >([]);

  const addAlert = (
    type: string,
    message: string | JSX.Element,
    action?: JSX.Element,
  ) => {
    setAlerts([...alerts, { type, message, action }]);
  };

  const setAlert = (
    type: string,
    message: string | JSX.Element,
    action?: JSX.Element,
  ) => {
    setAlerts([{ type, message, action }]);
  };

  const log = (type: string, args: readonly any[]) => {
    const message = args.join(' ');

    addAlert(type, message);
  };

  // Create a vega compatible logger to have the errors go to the ui instead of the console.
  // Information on logger requirements: https://github.io/vega/docs/api/view/#view_loggger
  const createLogger = () => {
    let logLevel = Warn;

    return {
      level(value) {
        if (value) {
          logLevel = value;

          return this;
        } else {
          return logLevel;
        }
      },
      error(...args) {
        if (logLevel >= Error) log('Error', args);
      },
      warn(...args) {
        if (logLevel >= Warn) log('Warning', args);
      },
      info(...args) {
        if (logLevel >= Info) log('Info', args);
      },
      debug(...args) {
        if (logLevel >= Debug) log('Debug', args);
      },
    } as LoggerInterface;
  };

  // Add the chart to the dom
  // ** note: the `editor` action is turned off as it is a slight security risk - the whole spec
  // including data leaves the current workspace and is shipped to the editor (all client side)
  // without warning - it's hypothetically fine, and folks can still manually do this workflow
  useLayoutEffect(() => {
    let view: View;

    (async function () {
      if (domReference.current) {
        const mimeType = getMimeType(relations) || '';
        const match = mimeType.match(/\.(vega|vegalite)\.v(\d+)$/);

        if (match && match.length === 3) {
          const mode = match[1] === 'vegalite' ? 'vega-lite' : 'vega';
          const vegaRelations = relations.filter(r =>
            r.relationId.startsWith(`/:plot/:${match[1]}/`),
          );
          const version = match[2];
          let spec: VisualizationSpec | undefined;

          try {
            spec = get(
              toJson(toObject(vegaRelations)),
              ['plot', match[1]],
              {},
            ) as VisualizationSpec;

            setAlerts([]);

            const result = await embed(domReference.current, spec, {
              renderer: 'svg',
              mode,
              actions: {
                export: true,
                source: true,
                editor: false,
                compiled: false,
              },
              logLevel: Warn,
            });

            view = result.view;

            const logger = createLogger();

            view.logger(logger);

            // Check the package version sent in the mimetype vs what is built into the app
            const packageVersion =
              mode === 'vega'
                ? getMajorVersion(vegaVersion)
                : getMajorVersion(vegaliteVersion);

            if (version !== packageVersion) {
              setAlert(
                'Warning',
                `Specification requested ${mode} version ${version}, but rendering with version ${packageVersion}`,
              );
            }
          } catch (error: any) {
            if (domReference.current) {
              // clear the current chart if it exists
              domReference.current.innerHTML = '';
            }

            setAlert(
              'Error',
              <>
                {error.message}
                <br />
                There is an error in the vega spec. Debug it in the{' '}
                <a
                  href={`https://vega.github.io/editor/#/custom/${mode}`}
                  target='_blank'
                  rel='noreferrer'
                  className='underline hover:text-red-400'
                >
                  vega editor
                </a>
                .
              </>,
              spec ? (
                <Button
                  data-testid='copy-spec-btn'
                  size='sm'
                  type='primary'
                  className='mr-1'
                  onClick={() => copyToClipboard(JSON.stringify(spec, null, 2))}
                >
                  Copy Vega Spec
                </Button>
              ) : undefined,
            );
          }
        }
      }
    })();

    return () => {
      if (view) {
        view.finalize();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relations]);

  return (
    <>
      {alerts.map((alert, index) => (
        <Alert key={index} type='error'>
          <div className='flex justify-between items-center'>
            <span>
              {`${alert.type}: `}
              {alert.message}
            </span>
            {alert.action}
          </div>
        </Alert>
      ))}

      <div data-testid='vega-mime' ref={domReference}></div>
    </>
  );
}
