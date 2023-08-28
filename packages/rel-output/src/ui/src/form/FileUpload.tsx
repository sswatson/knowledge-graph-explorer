import classNames from 'classnames';
import { get } from 'lodash-es';
import { ChangeEvent, useEffect } from 'react';
import { RegisterOptions, useFormContext, useWatch } from 'react-hook-form';
import { RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';

import { bytesToSize, readFile, TextFile } from '@relationalai/utils';

import FileDropZone from './FileDropZone';

const errorClasses =
  'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500';
const defaultClasses =
  'focus:ring-gray-500 focus:border-gray-500 border-gray-300 focus-within:border-gray-500';

type ConnectedFileUploadProps = {
  name: string;
  accept?: string;
  regOptions?: RegisterOptions;
};

export function ConnectedFileUpload({
  name,
  accept,
  regOptions,
}: ConnectedFileUploadProps) {
  const formContext = useFormContext();

  if (!formContext) {
    throw new Error(
      `Couldn't find form context. Make sure you're using Form or FormProvider.`,
    );
  }

  const {
    setValue,
    getValues,
    formState: { errors },
  } = formContext;

  const error = get(errors, name);
  const file = useWatch({ name });
  const id = getValues('id');

  useEffect(() => {
    formContext.register(name, {
      ...regOptions,
      value: getValues(name),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, regOptions]);

  const handleRemoveFile = () => updateFormValue();

  const updateFormValue = (file?: TextFile) => {
    setValue(name, file, { shouldDirty: true, shouldValidate: true });
  };

  const loadFile = async (file: File) => {
    if (file) {
      try {
        const result = await readFile(file);

        updateFormValue(result);
      } catch (error_: any) {
        formContext.setError(name, {
          message: error_?.message,
        });
      }
    } else {
      updateFormValue();
    }
  };

  const handleFileDrop = (files: File[]) => loadFile(files[0]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.files && loadFile(event.target.files[0]);
    // re-setting the input value
    // so that the same file can be selected again
    event.target.value = '';
  };

  return (
    <FileDropZone
      onFileDrop={handleFileDrop}
      className={classNames(
        'px-3 py-2 border-2 rounded-md border-dashed transition-border duration-200 ease-in-out',
        error ? errorClasses : defaultClasses,
      )}
      overlayClassName='z-20'
    >
      <div className='flex text-sm text-gray-600 gap-1 whitespace-nowrap justify-center'>
        <label
          htmlFor={`${id}/${name}`}
          className='relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none'
        >
          <span>Upload a file</span>
          <input
            accept={accept}
            data-testid={`file-upload-${name}`}
            id={`${id}/${name}`}
            type='file'
            className='sr-only'
            onChange={handleChange}
          />
        </label>

        {file && (
          <div className='overflow-ellipsis overflow-hidden'>{file.name}</div>
        )}

        {file && <div className='font-bold'>({bytesToSize(file.size)})</div>}

        {file && (
          <button type='button' title='Remove' onClick={handleRemoveFile}>
            <RiCloseLine className='h-3 w-3 cursor-pointer' />
          </button>
        )}

        {!file && <div>or drag and drop</div>}
      </div>
      {error && (
        <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
          <RiErrorWarningLine
            data-testid={`file-upload-error-icon-${name}`}
            className='h-5 w-5 text-red-500'
            aria-hidden='true'
          />
        </div>
      )}
    </FileDropZone>
  );
}

export default ConnectedFileUpload;
